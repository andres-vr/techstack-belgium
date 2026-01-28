<template>
  <div :id="props.id" class="space-y-1">
    <label
      :for="props.id + '-input'"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ props.label }}
      <span v-if="props.required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <NuxtImg
        src="/icons/search.svg"
        alt="search"
        aria-hidden="true"
        class="text-blue-500 w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        width="16"
        height="16"
      />
      <input
        :id="props.id + '-input'"
        v-model="query"
        :placeholder="placeholder"
        :disabled="props.disabled"
        :required="props.required"
        class="w-full pl-10 pr-4 py-2 border border-surface rounded bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        @input="onInput"
        @focus="onFocus"
        @click="onFocus"
      />
      <div
        v-if="open && matchingCompanies.length > 0"
        class="absolute left-0 right-0 top-full mt-1 z-[9999] max-h-[50dvh] overflow-y-auto bg-surface border border-surface rounded shadow-lg"
      >
        <p class="text-xs text-muted px-3 py-2">
          {{ matchingCompanies.length }} {{ t("index.companiesFound") }}
        </p>
        <div
          v-for="(company, __idx) in matchingCompanies"
          :key="company.value + '-' + __idx"
        >
          <span
            @click="select(company.value)"
            class="block w-full py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
            :title="`Select company: ${company.label}`"
          >
            {{ company.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, required: true },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  options: {
    type: Array as () => Array<{ value: string; label: string }>,
    default: () => [],
  },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
const query = ref(props.modelValue || "");
const open = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    query.value = v || "";
  },
);

const filteredOptions = computed(() => {
  const q = String(query.value || "")
    .toLowerCase()
    .trim();
  // Do not show any options until user typed at least 2 characters
  if (q.length < 2) return [];
  // Match against value and label for more robust matching
  return props.options.filter((o: any) => {
    const val = String(o.value || o.label || "").toLowerCase();
    return val.startsWith(q);
  });
});

const matchingCompanies = filteredOptions;

function onInput() {
  // Only open dropdown when query has at least 2 characters
  open.value = String(query.value || "").trim().length >= 2;
  emit("update:modelValue", query.value);
}

function onFocus() {
  // If there are already 2+ characters, open the dropdown, otherwise keep closed
  open.value = String(query.value || "").trim().length >= 2;
}

function select(val: string) {
  query.value = val;
  emit("update:modelValue", val);
  open.value = false;
}

// close on outside click
if (import.meta.client) {
  const onDoc = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`#${props.id}`)) {
      open.value = false;
    }
  };
  onMounted(() => document.addEventListener("click", onDoc));
  onBeforeUnmount(() => document.removeEventListener("click", onDoc));
}
</script>
