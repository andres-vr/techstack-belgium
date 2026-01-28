<template>
  <div class="relative w-full h-full">
    <!-- Full screen map -->
    <div
      ref="mapContainer"
      class="absolute top-0 left-0 right-0 bottom-0 w-full h-full m-0 p-0 rounded-2xl"
    />

    <!-- Company carousel popup (for multiple companies at same location) -->
    <div
      v-if="carouselCompanies.length > 0"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-2xl px-4 pt-6"
    >
      <!-- Counter above carousel -->
      <div
        v-if="carouselCompanies.length > 1"
        class="absolute -top-4 left-1/2 -translate-x-1/2 flex justify-center z-60"
      >
        <div
          class="bg-white/95 dark:bg-gray-900/80 text-sm text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md font-medium shadow-md"
        >
          <span class="font-semibold">{{ currentCarouselIndex + 1 }}</span>
          <span class="text-muted"> of </span>
          <span>{{ carouselCompanies.length }}</span>
        </div>
      </div>

      <!-- Carousel container with centered layout -->
      <div class="flex items-center justify-center gap-4">
        <!-- Left arrow (kept in DOM to avoid layout shift) -->
        <button
          :class="[
            'flex-shrink-0 bg-gray-300 dark:bg-gray-700 bg-opacity-70 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center w-10 h-10 z-10',
            !(carouselCompanies.length > 1 && currentCarouselIndex > 0)
              ? 'invisible'
              : '',
          ]"
          :disabled="
            !(carouselCompanies.length > 1 && currentCarouselIndex > 0)
          "
          @click.prevent="prevCompany"
        >
          <span class="text-gray-800 dark:text-gray-200 text-xl">‹</span>
        </button>

        <!-- Carousel content -->
        <div class="flex-1 flex justify-center">
          <CompanyCard
            :company="carouselCompanies[currentCarouselIndex] as Company"
            :inMap="true"
            @close="handleClose"
          />
        </div>

        <!-- Right arrow (kept in DOM to avoid layout shift) -->
        <button
          :class="[
            'flex-shrink-0 bg-gray-300 dark:bg-gray-700 bg-opacity-70 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center w-10 h-10 z-10',
            !(
              carouselCompanies.length > 1 &&
              currentCarouselIndex < carouselCompanies.length - 1
            )
              ? 'invisible'
              : '',
          ]"
          :disabled="
            !(
              carouselCompanies.length > 1 &&
              currentCarouselIndex < carouselCompanies.length - 1
            )
          "
          @click.prevent="nextCompany"
        >
          <span class="text-gray-800 dark:text-gray-200 text-xl">›</span>
        </button>
      </div>
    </div>

    <!-- Tooltip for single company mode -->
    <div
      v-if="tooltipVisible && isSingleMode"
      :style="tooltipStyle"
      class="absolute z-50 pointer-events-none"
    >
      <div
        class="bg-white/95 dark:bg-gray-800/95 text-sm text-gray-900 dark:text-gray-100 px-3 py-1 rounded shadow-lg whitespace-nowrap"
      >
        {{ tooltipContent }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Company } from "~~/types";

const props = defineProps<{
  company?: Company;
  companies?: Company[];
}>();

const mapContainer = ref<HTMLElement | null>(null);
const carouselCompanies = ref<Company[]>([]);
const currentCarouselIndex = ref(0);
const mapLoaded = ref(false);
const tooltipVisible = ref(false);
const tooltipContent = ref("");
const tooltipStyle = ref<Record<string, string>>({});
let map: maplibregl.Map | null = null;
const center = ref<[number, number]>([4.35, 50.85]);

// Determine if we're in single company mode or multiple companies mode
const isSingleMode = computed(() => !!props.company && !props.companies);
const isMultiMode = computed(() => !!props.companies || false);

// Get the list of companies to display
const displayCompanies = computed(() => {
  if (props.companies) return props.companies;
  if (props.company) return [props.company];
  return [];
});

// Determine if clustering should be enabled
const shouldCluster = computed(() => {
  return isMultiMode.value && displayCompanies.value.length > 1;
});

function handleClose() {
  carouselCompanies.value = [];
}

function prevCompany() {
  if (currentCarouselIndex.value > 0) {
    currentCarouselIndex.value--;
  }
}

function nextCompany() {
  if (currentCarouselIndex.value < carouselCompanies.value.length - 1) {
    currentCarouselIndex.value++;
  }
}

function fitMapToSource(fc: any) {
  if (!map || !fc || !fc.features || fc.features.length === 0) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const f of fc.features) {
    if (!f.geometry || f.geometry.type !== "Point") continue;
    const [lng, lat] = f.geometry.coordinates;
    if (lng < minX) minX = lng;
    if (lat < minY) minY = lat;
    if (lng > maxX) maxX = lng;
    if (lat > maxY) maxY = lat;
  }
  if (!isFinite(minX)) return;
  if (minX === maxX && minY === maxY) {
    const d = 0.01;
    minX -= d;
    maxX += d;
    minY -= d;
    maxY += d;
  }
  map.fitBounds(
    [
      [minX, minY],
      [maxX, maxY],
    ],
    { padding: 80, maxZoom: 15 },
  );
}

const { buildGeojsonFromCompanies } = useMap();

// Watch for changes to the companies to keep the map source in sync
watch(
  displayCompanies,
  async (newVal) => {
    if (!map || !mapLoaded.value) return;
    try {
      const data = await buildGeojsonFromCompanies(newVal as Company[]);
      if (!data || !data.features) return;

      const src = map.getSource("companies") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!src) {
        map.addSource("companies", {
          type: "geojson",
          data: data as any,
          cluster: shouldCluster.value,
          clusterMaxZoom: 16,
          clusterRadius: 40,
          clusterMinPoints: 2,
        } as any);
      } else {
        src.setData(data as any);
      }

      addLayers(map, shouldCluster.value);
      setupInteractions(map, shouldCluster.value);

      if (data.features.length) fitMapToSource(data);
    } catch (err) {
      console.error("Error updating map source:", err);
    }
  },
  { deep: true },
);

function showClusterCarousel(
  leaves: any[],
  clusterId?: number,
  clusterCoords?: [number, number],
) {
  if (!map || !leaves || !leaves.length) return;

  const coordinates = leaves
    .map((l) => {
      const geom = l.geometry;
      if (geom?.type === "Point" && geom.coordinates) {
        return `${geom.coordinates[0]},${geom.coordinates[1]}`;
      }
      return null;
    })
    .filter(Boolean);

  const uniqueCoordinates = new Set(coordinates);

  // If multiple different coordinates, zoom in to split the cluster
  if (uniqueCoordinates.size > 1) {
    if (clusterId && clusterCoords) {
      const source = map!.getSource("companies") as maplibregl.GeoJSONSource;
      source
        .getClusterExpansionZoom(clusterId)
        .then((zoom: number) => {
          const targetZoom = zoom || map!.getZoom() + 2;
          const currentZoom = map!.getZoom();
          const finalZoom = Math.max(targetZoom, currentZoom + 1);

          map!.easeTo({
            center: clusterCoords,
            zoom: Math.min(finalZoom, 18),
            duration: 800,
          });
        })
        .catch(() => {
          map!.easeTo({
            center: clusterCoords,
            zoom: Math.min(map!.getZoom() + 2, 18),
            duration: 800,
          });
        });
    }
    return;
  }

  // All companies are at the same location - show carousel
  const propsList = leaves.map((l) => l.properties || {});
  const allCompanies = displayCompanies.value;
  const companies = propsList
    .map((p: any) => allCompanies.find((c: Company) => c.cbe === p.cbe))
    .filter((x): x is Company => !!x);

  if (!companies.length) return;

  carouselCompanies.value = companies;
  currentCarouselIndex.value = 0;
}

function setupInteractions(map: maplibregl.Map, cluster: boolean) {
  if (cluster) {
    // Cluster click handler
    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (!features || !features.length) return;

      const props = features[0]?.properties || {};
      const clusterId = props.cluster_id;
      const coords = (features[0]?.geometry as any)?.coordinates;
      const source = map.getSource("companies") as maplibregl.GeoJSONSource;

      if (!clusterId || !source) return;

      source.getClusterLeaves(clusterId, 1000, 0).then((leaves: any[]) => {
        if (!leaves || !leaves.length) return;
        showClusterCarousel(leaves, clusterId, coords);
      });
    });

    // Cursor changes for clusters
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });
  }

  // Unclustered point click handler (works for both modes)
  map.on("click", "unclustered-point", (e) => {
    const feat = e.features && e.features[0];
    if (!feat || !feat.properties) return;
    const featureProps = feat.properties as any;

    if (isSingleMode.value) {
      // Show tooltip for single company mode
      const address = featureProps.address || featureProps.name || "";
      if (!address) return;

      const px = (e.point as any).x || 0;
      const py = (e.point as any).y || 0;
      tooltipStyle.value = {
        left: `${px}px`,
        top: `${py - 12}px`,
        transform: "translate(-50%, -100%)",
      };
      tooltipContent.value = address;
      tooltipVisible.value = true;
    } else {
      // Show company card for multi-company mode
      const found = displayCompanies.value.find(
        (c: Company) => c.cbe === featureProps.cbe,
      );
      if (found) {
        carouselCompanies.value = [found];
        currentCarouselIndex.value = 0;
      }
    }
  });

  // Hide tooltip when clicking outside markers (single mode only)
  if (isSingleMode.value) {
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });
      if (!features || !features.length) {
        tooltipVisible.value = false;
      }
    });

    map.on("movestart", () => {
      tooltipVisible.value = false;
    });
  }

  // Cursor changes for unclustered points
  map.on("mouseenter", "unclustered-point", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point", () => {
    map.getCanvas().style.cursor = "";
  });
}

function addLayers(map: maplibregl.Map, cluster: boolean) {
  // Remove existing layers if switching modes
  if (map.getLayer("unclustered-point")) map.removeLayer("unclustered-point");
  if (map.getLayer("clusters")) map.removeLayer("clusters");
  if (map.getLayer("cluster-count")) map.removeLayer("cluster-count");

  if (cluster) {
    // Cluster layers
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "companies",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          5,
          "#4cc66b",
          10,
          "#f1c40f",
          15,
          "#f28cb1",
          25,
          "#d30f3b",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          14,
          5,
          18,
          10,
          22,
          15,
          26,
          25,
          32,
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "companies",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    });

    // Unclustered points (for multi-location clusters)
    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "companies",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": 8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });
  } else {
    // Simple markers (no clustering)
    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "companies",
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });
  }
}

function initMap() {
  // Ensure DOM is ready and we have a container
  if (!mapContainer.value) {
    console.error("Map container not found, aborting map init");
    return;
  }

  map = new maplibregl.Map({
    container: mapContainer.value as HTMLElement,
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    center: center.value,
    zoom: 12,
    pitch: 0,
    maxPitch: 0,
    minZoom: 6,
    maxZoom: 18,
    attributionControl: false,
  });

  map.touchZoomRotate.disableRotation();
  map.dragRotate.disable();

  const nav = new maplibregl.NavigationControl({ showCompass: true });
  map.addControl(nav);

  map.on("load", async () => {
    mapLoaded.value = true;

    try {
      const companies = displayCompanies.value;

      if (!companies.length) {
        console.error("No companies to display on map");
        return;
      }

      // Build geojson from companies
      const data = await buildGeojsonFromCompanies(companies);

      if (!data.features || data.features.length === 0) {
        console.warn("No valid coordinates found for company locations");
        console.warn("Sample company locations:", companies[0]?.locations);
        return;
      }

      // Add geojson source
      if (!map!.getSource("companies")) {
        map!.addSource("companies", {
          type: "geojson",
          data: data as any,
          cluster: shouldCluster.value,
          clusterMaxZoom: 16,
          clusterRadius: 40,
          clusterMinPoints: 2,
        } as any);
      } else {
        (map!.getSource("companies") as maplibregl.GeoJSONSource).setData(
          data as any,
        );
      }

      // Add appropriate layers based on mode
      addLayers(map!, shouldCluster.value);

      // Wire up interactions
      setupInteractions(map!, shouldCluster.value);

      // Fit bounds to source
      if (data.features.length) fitMapToSource(data);
    } catch (err) {
      console.error("Error building map source:", err);
    }
  });

  map.on("style.load", () => {
    mapLoaded.value = true;
    if (map && center.value) {
      try {
        map.setCenter(center.value as [number, number]);
      } catch (e) {
        void e;
      }
    }
    // Rebuild layers after style reload if source exists
    if (map && map.getSource && map.getSource("companies")) {
      addLayers(map!, shouldCluster.value);
    }
  });
}

onMounted(async () => {
  // Wait for DOM to render so map container exists and has dimensions
  await nextTick();
  initMap();
});
</script>
