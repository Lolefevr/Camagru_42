#!/usr/bin/env bash
set -e

host="$1"
shift
cmd="$@"

until nc -z "$host" 3306; do
  echo "Waiting for MariaDB at $host:3306..."
  sleep 1
done

echo "MariaDB is up - executing command"
exec $cmd
