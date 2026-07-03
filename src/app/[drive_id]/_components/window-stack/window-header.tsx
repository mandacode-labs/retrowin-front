import { forwardRef, memo } from "react";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import CircularLoader from "@/primitives/circular-loader/circular_loader";
import styles from "./window-header.module.css";
import WindowHeaderIcon from "./window-header-icon";

export default memo(
  forwardRef(function WindowHeader(
    {
      title,
      loading,
      prevWindowAction,
      nextWindowAction,
      hasPrevWindow,
      hasNextWindow,
      buttonActions,
      onMouseDown,
      onMouseEnter,
    }: {
      title: string;
      loading: boolean;
      prevWindowAction: () => void;
      nextWindowAction: () => void;
      hasPrevWindow: boolean;
      hasNextWindow: boolean;
      buttonActions: {
        action: () => void;
        icon: "fullscreen" | "exit_fullscreen" | "close" | "minimize";
        style?: React.CSSProperties;
      }[];
      onMouseDown?: (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
      ) => void;
      onMouseEnter?: () => void;
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    return (
      <header
        className={`flex-center ${styles.container}`}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        ref={ref}
        role="toolbar"
        aria-label="window header"
      >
        <div className={styles.header_left_container}>
          <div className={styles.navigate_button_container}>
            <MdNavigateBefore
              className={`${styles.navigate_button} ${hasPrevWindow ? styles.active : ""}`}
              onClick={prevWindowAction}
            />
            <MdNavigateNext
              className={`${styles.navigate_button} ${hasNextWindow ? styles.active : ""}`}
              onClick={nextWindowAction}
            />
          </div>
          <div className={styles.header_title}>{title}</div>
          {loading && <CircularLoader size="20px" border="3px" />}
        </div>
        <div className={styles.header_right_container}>
          <div className={styles.window_button_container}>
            {buttonActions.map(({ action, icon, style }) => (
              <WindowHeaderIcon
                key={icon}
                className={styles.window_button}
                icon={icon}
                onClick={action}
                style={style}
              />
            ))}
          </div>
        </div>
      </header>
    );
  })
);
