<template>
    <div class="vrsmod-logo" :title="ManagerInformation.APP_NAME">
        <svg width="28" height="28" viewBox="0 0 28 28">
            <rect width="28" height="28" rx="6" fill="var(--card-expand-background-color, #232323)" />
            <circle cx="6.98" cy="7.25" r="1.7" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="8.24" cy="10.98" r="1.51" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="9.9" cy="14.01" r="1.29" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="12.21" cy="16.36" r="1.32" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="13.87" cy="20.71" r="1.34" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="13.54" cy="20.37" r="1.9" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="15.81" cy="16.91" r="1.92" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="16.6" cy="14.6" r="1.45" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="18.44" cy="10.28" r="1.47" fill="var(--scheme-primary, #e2196b)" />
            <circle cx="21.25" cy="7.3" r="1.65" fill="var(--scheme-primary, #e2196b)" />
        </svg>
    </div>
</template>

<script lang="ts" setup>
import ManagerInformation from '../../_managerinf/ManagerInformation';
</script>

<style scoped lang="scss">
.vrsmod-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
}
</style>
