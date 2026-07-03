import { FaMinus, FaRegSquareFull } from "react-icons/fa6";
import { FiMinimize } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

export default function WindowHeaderIcon({
  icon,
  onClick,
  className,
  style,
}: {
  icon: "fullscreen" | "exit_fullscreen" | "close" | "minimize";
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const baseStyle = {
    strokeWidth: 2.5,
    ...style,
  };

  switch (icon) {
    case "fullscreen":
      return (
        <FaRegSquareFull
          className={className}
          onClick={onClick}
          style={baseStyle}
        />
      );
    case "exit_fullscreen":
      return (
        <FiMinimize className={className} onClick={onClick} style={baseStyle} />
      );
    case "minimize":
      return (
        <FaMinus className={className} onClick={onClick} style={baseStyle} />
      );
    case "close":
      return (
        <IoMdClose className={className} onClick={onClick} style={baseStyle} />
      );
    default:
      return null;
  }
}
