"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import Background from "@/app/[drive_id]/_components/background";
import DragLayer from "@/app/[drive_id]/_components/drag-layer";
import MenuBox from "@/app/[drive_id]/_components/menu/menu-box";
import Navbar from "@/app/[drive_id]/_components/navbar/navbar";
import SelectBoxLayer from "@/app/[drive_id]/_components/select-box-layer";
import Window from "@/app/[drive_id]/_components/window-stack/window";
import { BindingsClient } from "@/app/[drive_id]/_lib/bindings-client";
import { useMe } from "@/domain/auth";
import { useDrive } from "@/domain/file-listing";
import { ToastContainer } from "@/domain/toast";
import { WindowType } from "@/entities/window";
import { createWindowKey } from "@/infra/random-keys";
import { useWindowStore } from "@/infra/stores";
import FileContainer from "@/primitives/file-container/file_container";
import styles from "./page.module.css";

export default function DrivePage() {
  const router = useRouter();
  const params = useParams();
  const driveID = params.drive_id as string;

  const backgroundWindowKey = useMemo(() => createWindowKey(), []);

  const windows = useWindowStore((state) => state.windows);
  const newBackgroundWindow = useWindowStore((state) => state.newWindow);
  const setCurrentWindow = useWindowStore((state) => state.setCurrentWindow);

  const backgroundWindowRef = useRef<HTMLDivElement>(null);

  const meQuery = useMe();
  const driveQuery = useDrive(driveID);

  const isUnauthorized =
    meQuery.isSuccess && meQuery.data === null && !meQuery.isFetching;

  useEffect(() => {
    if (isUnauthorized) {
      router.push("/login");
    }
  }, [isUnauthorized, router]);

  useEffect(() => {
    if (driveQuery.isSuccess && driveQuery.data?.status === 200 && driveID) {
      newBackgroundWindow({
        targetKey: "/",
        type: WindowType.Background,
        title: driveQuery.data.data.name || "background",
        key: backgroundWindowKey,
        driveID,
      });
    }
  }, [
    backgroundWindowKey,
    driveID,
    driveQuery.data,
    driveQuery.isSuccess,
    newBackgroundWindow,
  ]);

  const onMouseEnter = useCallback(() => {
    setCurrentWindow({
      key: backgroundWindowKey,
      windowRef: backgroundWindowRef,
      contentRef: null,
      headerRef: null,
    });
  }, [backgroundWindowKey, setCurrentWindow]);

  if (
    meQuery.isLoading ||
    meQuery.isPending ||
    !driveID ||
    driveQuery.isLoading ||
    driveQuery.isPending ||
    !driveQuery.data ||
    driveQuery.data.status !== 200
  ) {
    return <div className="flex-center full-size">Loading...</div>;
  }

  return (
    <div className={`${styles.page} flex-center full-size`} role="application">
      <BindingsClient />
      <Background>
        <MenuBox>
          <SelectBoxLayer>
            <DragLayer>
              <section
                ref={backgroundWindowRef}
                className={`full-size flex-center ${styles.background_window}`}
                onMouseEnter={onMouseEnter}
                aria-label="background workspace"
                data-iid="workspace"
                data-zone="background"
              >
                <FileContainer
                  windowKey={backgroundWindowKey}
                  driveID={driveID}
                  path="/"
                  upload
                  backgroundFile
                />
              </section>
              {windows
                .filter((w) => w.type !== WindowType.Background)
                .map((window) => (
                  <Window key={window.key} windowKey={window.key} />
                ))}
            </DragLayer>
          </SelectBoxLayer>
        </MenuBox>
      </Background>
      <Navbar windows={windows} driveID={driveID} />
      <ToastContainer />
    </div>
  );
}
