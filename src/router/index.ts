import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { start, done } from "@/utils/nprogress";
import env from "@/config/env.config";

const DEFAULT_DOCUMENT_TITLE = env.appTitle;


export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/views/random/index.vue"),
    meta: {
      title: "自定义分组器",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/components/NotFound/index.vue"),
    meta: {
      title: "404",
      showMenu: false,
      hidden: true,
      notRequiredAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: constantRoutes,
});

router.beforeEach(async (to) => {
  start();
  document.title =
    typeof to.meta.title === "string"
      ? to.meta.title + "-" + DEFAULT_DOCUMENT_TITLE
      : DEFAULT_DOCUMENT_TITLE;
});

router.afterEach(() => {
  done();
});

export default router;
