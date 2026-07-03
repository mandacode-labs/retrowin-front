import { forwardRef, memo } from "react";
import Navigator from "@/domain/file-listing/navigator-window";
import Uploader from "@/domain/file-upload/uploader-window";
import ImageViewer from "@/domain/media/image-window";
import InfoViewer from "@/domain/media/info-window";
import VideoViewer from "@/domain/media/video-window";
import { WindowType } from "@/entities/window";
import styles from "./window-content-router.module.css";

// biome-ignore lint/suspicious/noExplicitAny: component props vary by WindowType
const contentComponents: Partial<Record<WindowType, React.ComponentType<any>>> =
  {
    [WindowType.Navigator]: Navigator,
    [WindowType.Uploader]: Uploader,
    [WindowType.Image]: ImageViewer,
    [WindowType.Video]: VideoViewer,
    [WindowType.Info]: InfoViewer,
  };

function getContentProps(
  type: WindowType,
  fileKey: string,
  fileName: string,
  windowKey: string,
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>
) {
  switch (type) {
    case WindowType.Navigator:
      return { path: fileKey, windowKey, setLoading };
    case WindowType.Uploader:
      return { targetPath: fileKey };
    case WindowType.Image:
      return { fileKey, fileName, windowKey };
    case WindowType.Video:
      return { fileKey };
    case WindowType.Info:
      return { fileKey, fileName };
    default:
      return {};
  }
}

export default memo(
  forwardRef(function WindowContent(
    {
      fileKey,
      fileName,
      windowKey,
      setLoading,
      type,
      onMouseEnter,
      onMouseLeave,
    }: {
      fileKey: string;
      fileName: string;
      windowKey: string;
      setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
      type: WindowType;
      onMouseEnter?: () => void;
      onMouseLeave?: () => void;
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    const ContentComponent = contentComponents[type];
    const canRender =
      ContentComponent &&
      (type === WindowType.Uploader || setLoading || fileName);

    return (
      <section
        className={`flex-center full-size ${styles.container}`}
        ref={ref}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label="window content"
        data-iid={windowKey}
        data-zone="window-content"
      >
        {canRender && (
          <ContentComponent
            {...getContentProps(type, fileKey, fileName, windowKey, setLoading)}
          />
        )}
      </section>
    );
  })
);
