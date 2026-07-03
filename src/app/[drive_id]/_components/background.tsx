import Image from "next/image";
import styles from "./background.module.css";

export default function Background({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.container}>
      <Image
        src={"/assets/background.webp"}
        alt="background"
        fill
        className={styles.image}
        priority
      />
      {children}
    </div>
  );
}
