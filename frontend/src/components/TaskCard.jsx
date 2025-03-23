// frontend/src/components/TaskCard.jsx
import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from '../utils/constants';

// Define color constants for task priority and labels
const PRIORITY_COLORS = {
  low: 'bg-success/20 text-success',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-error/20 text-error'
};

const LABEL_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-amber-100 text-amber-800',
  'bg-red-100 text-red-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
];

const TaskCard = ({ 
  task, 
  index, 
  columnId, 
  moveTask,
  onUpdateTask, 
  onDeleteTask 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [labels, setLabels] = useState(task.labels || []);
  const [newLabel, setNewLabel] = useState('');
  
  const ref = useRef(null);

  // First part - Make the card draggable
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: { 
      id: task._id, 
      index, 
      columnId,
      task // Include full task data
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Second part - Make the card a drop target for reordering within the same column
  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      
      // Don't replace items with themselves
      if (item.id === task._id) {
        return;
      }
      
      // Only reorder if in the same column
      if (item.columnId !== columnId) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (item.index < index && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (item.index > index && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveTask(item.id, item.columnId, columnId, index);
      
      // Note: we're mutating the monitor item here!
      // This is generally not recommended, but this is a special case
      item.index = index;
    },
  });

  // Apply the ref to both drag source and drop target
  drag(drop(ref));

  // Handle editing the task
  const handleEditSave = () => {
    if (title.trim()) {
      onUpdateTask(task._id, {
        title,
        description,
        priority,
        labels
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      onDeleteTask(task._id);
    }
  };

  const handleToggleComplete = () => {
    onUpdateTask(task._id, { completed: !task.completed });
  };

  const handleAddLabel = (e) => {
    e.preventDefault();
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      const updatedLabels = [...labels, newLabel.trim()];
      setLabels(updatedLabels);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  return (
    <div
      ref={ref}
      className={`card bg-base-100 shadow hover:shadow-md mb-2 cursor-grab ${
        isDragging ? 'opacity-50' : ''
      } ${task.completed ? 'border-l-4 border-success' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {isEditing ? (
        <div className="card-body p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-sm input-bordered w-full mb-2"
            placeholder="Titre de la tâche"
          />
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered textarea-sm w-full mb-2"
            placeholder="Description (optionnel)"
            rows="2"
          />
          
          <div className="mb-2">
            <label className="text-xs font-semibold block mb-1">Priorité</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="select select-sm select-bordered w-full"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          
          <div className="mb-2">
            <label className="text-xs font-semibold block mb-1">Étiquettes</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {labels.map((label, index) => (
                <span 
                  key={index} 
                  className={`badge ${LABEL_COLORS[index % LABEL_COLORS.length]} badge-sm`}
                >
                  {label}
                  <button 
                    onClick={() => handleRemoveLabel(label)}
                    className="ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddLabel} className="flex gap-1">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="input input-sm input-bordered flex-grow"
                placeholder="Nouvelle étiquette"
              />
              <button type="submit" className="btn btn-sm btn-primary">
                Ajouter
              </button>
            </form>
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-sm btn-ghost"
            >
              Annuler
            </button>
            <button onClick={handleEditSave} className="btn btn-sm btn-primary">
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="card-body p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={handleToggleComplete}
                  className="checkbox checkbox-sm"
                />
                <h3 className={`font-medium ${task.completed ? 'line-through text-base-content/60' : ''}`}>
                  {task.title}
                </h3>
              </div>
              
              {task.description && (
                <p className="text-sm mt-1 text-base-content/80">
                  {task.description}
                </p>
              )}
              
              {/* Labels */}
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {labels.map((label, index) => (
                    <span 
                      key={index} 
                      className={`badge ${LABEL_COLORS[index % LABEL_COLORS.length]} badge-sm`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-xs btn-ghost btn-square">
                ⋮
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box w-40">
                <li><a onClick={() => setIsEditing(true)}>Modifier</a></li>
                <li><a onClick={handleDelete} className="text-error">Supprimer</a></li>
              </ul>
            </div>
          </div>
          
          {/* Priority badge */}
          <div className="mt-2">
            <span className={`badge badge-sm ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
              {priority === 'low' ? 'Basse' : priority === 'high' ? 'Haute' : 'Moyenne'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;