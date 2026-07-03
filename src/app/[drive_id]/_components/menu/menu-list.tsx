import styles from "./menu-list.module.css";

let menuKeyCounter = 0;

export default function MenuList({
  menuList,
}: {
  menuList: { name: string; action: () => void }[];
}) {
  return (
    <div className={`${styles.container}`}>
      {menuList.map(({ name, action }) => {
        const key = name === "/" ? `divider-${menuKeyCounter++}` : name;
        return (
          <div className={`${styles.list_item_container}`} key={key}>
            {name === "/" ? (
              <div className={styles.list_split} />
            ) : (
              <div
                className={styles.list_item}
                onClick={() => action()}
                onKeyDown={(e) => e.key === "Enter" && action()}
                role="menuitem"
                tabIndex={0}
              >
                {name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
