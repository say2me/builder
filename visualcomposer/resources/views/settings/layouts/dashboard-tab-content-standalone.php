<?php
if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}
?>
<div class="vcv-dashboards-section-content">
    <?php

    $variables = vcfilter(
        'vcv:wp:dashboard:variables',
        [
            [
                'key' => 'VCV_SLUG',
                'value' => $slug,
                'type' => 'constant',
            ],
        ],
        ['slug' => $slug]
    );
    if (is_array($variables)) {
        foreach ($variables as $variable) {
            if (is_array($variable) && isset($variable['key'], $variable['value'])) {
                $type = isset($variable['type']) ? $variable['type'] : 'variable';
                evcview('partials/variableTypes/' . $type, $variable);
            }
        }
        unset($variable);
    }
    
    echo $content;
    ?>
</div>
