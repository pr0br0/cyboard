# Устанавливаем кодировку UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Создаем template промпта
$template = @"
# Анализ проекта Cyprus-Classified

## Технический стек
- Node.js с Express
- MongoDB и Mongoose
- Redis для кэширования
- Jest для тестирования

## Основные компоненты
{0}

## Зависимости
{1}

## Структура проекта
- API endpoints
- Аутентификация
- Загрузка медиа
- Кэширование
- Мониторинг

## Текущие задачи
1. Оптимизация производительности
2. Улучшение безопасности
3. Расширение тестов
4. [Ваша задача]
"@

# Анализ проекта
$components = Get-ChildItem -Recurse -File | Group-Object Directory | ForEach-Object {
    $dir = $_.Name
    $files = $_.Group
    [PSCustomObject]@{
        Directory = $dir
        Files = $files.Count
        Types = $files.Extension | Group-Object | ForEach-Object { "$($_.Name): $($_.Count)" }
    }
}

# Форматируем компоненты
$componentsText = ($components | ForEach-Object {
    "- $($_.Directory): $($_.Files) файлов"
}) -join "`n"

# Получаем зависимости из package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$dependencies = $packageJson.dependencies.PSObject.Properties.Name
$depsText = ($dependencies | ForEach-Object { "- $_" }) -join "`n"

# Формируем финальный промпт
$finalPrompt = $template -f $componentsText, $depsText

# Сохраняем в файл
$finalPrompt | Out-File -FilePath "project-analysis.md" -Encoding UTF8