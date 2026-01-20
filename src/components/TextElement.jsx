import { useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

/**
 * TextElement - A draggable, editable text element on the PDF canvas
 * Includes a drag handle that appears during editing mode
 */
const TextElement = ({ el, scale, isSelected, isEditing, scanEffect, handlers, onUpdate }) => {
    const containerRef = useRef(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const currentWidth = rect.width / scale;
            const currentHeight = rect.height / scale;

            if (Math.abs(currentWidth - el.width) > 1 || Math.abs(currentHeight - el.height) > 1) {
                onUpdate(el.id, { width: currentWidth, height: currentHeight });
            }
        }
    }, [el.content, el.fontFamily, el.fontSize, el.rotation, scale, onUpdate, el.width, el.height, el.id]);

    const style = {
        left: el.x,
        top: el.y,
        zIndex: 10,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'center center',
        position: 'absolute',
        cursor: scanEffect.enabled ? 'default' : (isEditing ? 'text' : 'move')
    };

    const uiWrapperStyle = {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none'
    };

    // Handle drag from the editing handle
    const handleEditDragStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingRef.current = true;

        // Call the move handler without stopping editing
        if (handlers.handleEditingDrag) {
            handlers.handleEditingDrag(e, el.id);
        }

        const handleGlobalMouseUp = () => {
            isDraggingRef.current = false;
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
    };

    // Prevent blur when clicking on drag handle
    const handleInputBlur = (e) => {
        // If the click is going towards the drag handle or we are already dragging, don't blur
        if (isDraggingRef.current) return;

        const relatedTarget = e.relatedTarget;
        if (relatedTarget && relatedTarget.closest('.edit-drag-handle')) {
            return;
        }

        // Delay the blur slightly to allow click events on handles to register first if needed
        setTimeout(() => {
            if (!isDraggingRef.current) {
                handlers.setEditingId(null);
            }
        }, 150);
    };

    return (
        <div
            ref={containerRef}
            onMouseDown={(e) => {
                // During editing, don't trigger move on the text area itself
                if (isEditing) {
                    e.stopPropagation();
                    return;
                }
                handlers.handleMouseDown(e, el.id);
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
                e.stopPropagation();
                handlers.setEditingId(el.id);
                handlers.setSelectedId(el.id);
            }}
            className={`group whitespace-nowrap px-2 py-1 ${isSelected && !scanEffect.enabled && !isEditing ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''} ${isEditing ? 'ring-2 ring-green-500 ring-offset-2' : 'border border-transparent hover:border-dashed hover:border-gray-400'}`}
            style={{
                ...style,
                color: el.color,
                fontSize: `${el.fontSize}px`,
                fontFamily: el.fontFamily || 'Helvetica',
                lineHeight: '1.2',
                textAlign: 'left',
                minWidth: '20px'
            }}
        >
            <div style={uiWrapperStyle}>
                {handlers.rotationSlider}
                {handlers.topMenu}
                {handlers.bottomMenu}
                {handlers.resizeHandle}
            </div>

            {isEditing ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* Sizer span to make the container grow with text */}
                    <span style={{
                        visibility: 'hidden',
                        whiteSpace: 'pre',
                        display: 'block',
                        padding: '4px 8px',
                        minWidth: '100px',
                        border: '2px solid transparent' // matches input border
                    }}>
                        {el.content || ' '}
                    </span>

                    <input
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        value={el.content}
                        onChange={(e) => handlers.onContentChange(el.id, e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handlers.setEditingId(null);
                            if (e.key === 'Escape') handlers.setEditingId(null);
                        }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            font: 'inherit',
                            color: 'inherit',
                            background: 'rgba(255,255,255,0.95)',
                            border: '2px solid #22c55e',
                            outline: 'none',
                            padding: '4px 8px',
                            margin: 0,
                            textAlign: 'left',
                            borderRadius: '4px'
                        }}
                    />
                    {/* Drag handle during editing */}
                    <div
                        className="edit-drag-handle"
                        tabIndex={-1}
                        style={{
                            position: 'absolute',
                            bottom: '-45px',
                            left: '0', // Align to left instead of center
                            cursor: 'grab',
                            zIndex: 100,
                            background: '#22c55e',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s, background 0.15s',
                            pointerEvents: 'auto',
                            transform: `rotate(${-el.rotation}deg)`
                        }}
                        onMouseDown={handleEditDragStart}
                        onMouseEnter={(e) => e.currentTarget.style.transform = `rotate(${-el.rotation}deg) scale(1.1)`}
                        onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${-el.rotation}deg)`}
                        title="Arrastra para mover / Drag to move"
                    >
                        <Move size={16} />
                    </div>
                </div>
            ) : (
                el.content
            )}
        </div>
    );
};

export default TextElement;
