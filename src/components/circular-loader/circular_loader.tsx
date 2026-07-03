import styles from "./circular_loader.module.css";

/**
 * Circular loader component
 * @param size - size of the loader
 * @param border - border of the loader
 * @returns - Circular loader component
 * @example
 * <CircularLoader size="100px" border="8px" />
 */
export default function CircularLoader({
  size = "100px",
  border = "8px",
}: {
  size?: string;
  border?: string;
}) {
  return (
    <div
      className={styles.loader}
      style={{
        width: size,
        height: size,
        border: `${border} solid rgba(255, 255, 255, 0.3)`,
        borderTop: `${border} solid white`,
      }}
    ></div>
  );
}
