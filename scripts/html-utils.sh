#!/bin/bash

generate_index() {
    local dir="$1"
    local title="$2"

    mkdir -p "$dir"
    
    cat > "$dir/index.html" << EOF
<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="https://onerom.org/style.css">
<link rel="stylesheet" href="/style.css">
<body>
<div class="app">
<h1>${title}</h1>
<ul>
EOF
    
    for item in "$dir"/*; do
        if [ -e "$item" ] && [ "$(basename "$item")" != "index.html" ]; then
            local name=$(basename "$item")
            echo "<li><a href=\"${name}\">${name}</a></li>" >> "$dir/index.html"
        fi
    done
    
    cat >> "$dir/index.html" << EOF
</ul>

<div id="footer"></div>
<script src="/js/footer.js" type="module"></script>
</div>
</body>
</html>
EOF
}