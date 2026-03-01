import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();

    useEffect(() => {
        async function boot() {
            if (webcontainerInstance) {
                setWebcontainer(webcontainerInstance);
                return;
            }
            if (!bootPromise) {
                bootPromise = WebContainer.boot();
            }
            try {
                const instance = await bootPromise;
                webcontainerInstance = instance;
                setWebcontainer(instance);
            } catch (error) {
                console.error('Failed to boot WebContainer:', error);
                bootPromise = null;
            }
        }
        boot();
    }, []);

    return webcontainer;
}