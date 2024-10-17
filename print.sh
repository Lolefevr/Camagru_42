#!/bin/bash

# Définir le dossier de travail
directory="./src"

# Fichier de sortie
output_file="./print_out.txt"

# Trouver tous les fichiers dans le dossier sauf dans src/uploads et src/frames, les lire avec cat et ajouter le chemin au début de chaque contenu
find "$directory" \( -type d -name "uploads" -o -name "frames" \) -prune -o -type f -print | while read -r file; do
    echo "==== $file ====" >> "$output_file"
    cat "$file" >> "$output_file"
    echo -e "\n" >> "$output_file"
done
