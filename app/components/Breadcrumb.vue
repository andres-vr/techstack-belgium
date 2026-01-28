<template>
  <nav
    aria-label="Breadcrumb"
    class="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-surface"
  >
    <div
      class="w-[min(90dvw,1200px)] mx-auto px-6 h-12 flex items-center text-sm text-muted"
    >
      <ol class="flex items-center gap-2">
        <li>
          <NuxtLink to="/" class="text-muted hover:underline">{{
            t("breadcrumb.home")
          }}</NuxtLink>
        </li>
        <li v-for="(c, i) in crumbs" :key="i" class="flex items-center">
          <span class="mx-2">/</span>
          <span v-if="i < crumbs.length - 1">
            <NuxtLink :to="c.to" class="text-muted hover:underline">{{
              c.label
            }}</NuxtLink>
          </span>
          <span v-else class="text-primary font-medium">{{ c.label }}</span>
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const { t, te } = useI18n();

const LOCALES = ["en", "nl", "fr", "de"];

function humanize(s: string) {
  const key = `breadcrumb.${s}`;
  try {
    if (te && te(key)) return t(key);
  } catch (e) {}
  return s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const crumbs = computed(() => {
  const raw = route.path.split("/").filter(Boolean);
  // preserve locale prefix for links but remove from labels
  let prefix = "";
  const parts = [...raw];
  if (parts.length && LOCALES.includes(parts[0] || "")) {
    prefix = "/" + parts.shift();
  }

  const results: { to: string; label: string }[] = [];
  let acc = prefix || "";
  for (let i = 0; i < parts.length; i++) {
    acc += "/" + parts[i];
    // try to use route.matched meta resolver if present
    const matched = route.matched?.find(
      (m: any) => m.path && acc.endsWith(m.path.replace(/:\w+/, "")),
    );

    // default label
    let label = humanize(parts[i] || "");

    // allow route meta to override label
    if (
      matched &&
      matched.meta &&
      (matched.meta as any).breadcrumb &&
      (matched.meta as any).breadcrumb.resolveLabel
    ) {
      try {
        const resolved = ((matched.meta as any).breadcrumb.resolveLabel as any)(
          route,
        );
        if (resolved) label = resolved;
      } catch (e) {}
    }

    // compute link target, with special-cases (keep provinces mapping)
    let to = acc || "/";
    if (parts[i] === "provinces") {
      to = (prefix || "") + "/provinces";
    }
    if (parts[i] === "technologies") {
      to = (prefix || "") + "/technologies";
    }

    results.push({ to, label });
  }
  return results;
});
</script>
