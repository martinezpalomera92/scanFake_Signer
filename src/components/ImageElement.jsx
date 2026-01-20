// ImageElement component - no React import needed in React 17+

/**
 * ImageElement - A draggable, resizable image/signature element on the PDF canvas
 */
const ImageElement = ({
    el,
    scale,
    isSelected,
    scanEffect,
    onMouseDown,
    rotationSlider,
    topMenu,
    resizeHandle
}) => {
    const style = {
        left: el.x,
        top: el.y,
        zIndex: 10,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'center center',
        position: 'absolute',
        cursor: scanEffect.enabled ? 'default' : 'move',
        width: el.width,
        height: el.height,
        mixBlendMode: 'multiply'
    };

    const uiWrapperStyle = {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none'
    };

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, el.id)}
            onClick={(e) => e.stopPropagation()}
            className={`group select-none ${isSelected && !scanEffect.enabled ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}`}
            style={style}
        >
            <div style={uiWrapperStyle}>
                {rotationSlider}
                {topMenu}
                {resizeHandle}
            </div>
            <img src={el.image} className="w-full h-full pointer-events-none object-contain" alt="signature" />
        </div>
    );
};

export default ImageElement;
