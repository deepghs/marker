/// <reference types="vite/client" />
declare module "*.vue" {
    import { DefineComponent } from "vue";
    const component:DefineComponent<{},{},any>
    export default component
 
}

interface ImportMetaEnv{
    readonly VITE_APP_TITLE:string
    readonly VITE_APP_VERSION:string
}