<template>
  <div
    class="w-screen min-h-screen max-w-full flex flex-col overflow-x-hidden pt-28"
  >
    <Header />
    <Breadcrumb class="overflow-x-auto mr-4" />
    <div class="flex-1 min-h-0">
      <NuxtPage />
      <SpeedInsights />
      <Analytics />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { SpeedInsights } from "@vercel/speed-insights/nuxt"
import { Analytics } from '@vercel/analytics/nuxt'
</script>