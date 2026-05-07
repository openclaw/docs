---
read_when:
    - Movendo a propriedade do host, das ferramentas, dos comandos, da documentação ou do protocolo do Canvas
    - Auditando se o Canvas ainda pertence ao núcleo
    - Preparando ou revisando o PR do Plugin experimental Canvas
summary: Plano e lista de verificação de auditoria para mover o Canvas para fora do núcleo e para um Plugin experimental incluído.
title: Refatoração do Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:24:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refatoração do Plugin Canvas

O Canvas é pouco usado e experimental. Trate-o como um Plugin integrado, não como um recurso central. O núcleo pode manter a infraestrutura genérica de Gateway, Node, HTTP, autenticação, configuração e cliente nativo, mas o comportamento específico do Canvas deve ficar em `extensions/canvas`.

## Objetivo

Mover a propriedade do Canvas para `extensions/canvas`, preservando o comportamento atual de nós pareados:

- a ferramenta `canvas` voltada para o agente é registrada pelo Plugin Canvas
- comandos de nó do Canvas são permitidos somente quando o Plugin Canvas os registra
- arquivos de host/fonte A2UI ficam no Plugin Canvas
- a materialização de documentos Canvas fica no Plugin Canvas
- a implementação de comandos da CLI fica no Plugin Canvas ou delega por meio de um barril de runtime pertencente ao Plugin
- a documentação e o inventário de Plugins descrevem o Canvas como experimental e respaldado por Plugin

## Não objetivos

- Não redesenhar a UI Canvas do app nativo nesta refatoração.
- Não remover o suporte de protocolo/cliente Canvas do iOS, Android ou macOS, a menos que uma decisão separada de produto diga que o Canvas deve ser excluído.
- Não criar uma estrutura ampla de serviço de Plugin apenas para o Canvas, a menos que pelo menos outro Plugin integrado precise do mesmo seam.

## Estado atual da branch

Concluído:

- Adicionado pacote de Plugin integrado em `extensions/canvas`.
- Adicionado `extensions/canvas/openclaw.plugin.json`.
- Movida a ferramenta `canvas` do agente de `src/agents/tools/canvas-tool.ts` para `extensions/canvas/src/tool.ts`.
- Removido o registro central de `createCanvasTool` de `src/agents/openclaw-tools.ts`.
- Movida a implementação do host Canvas de `src/canvas-host` para `extensions/canvas/src/host`.
- Mantido `extensions/canvas/runtime-api.ts` como o barril de compatibilidade pertencente ao Plugin para testes, empacotamento e helpers públicos externos do Canvas.
- Movida a materialização de documentos Canvas de `src/gateway/canvas-documents.ts` para `extensions/canvas/src/documents.ts`.
- Movida a implementação da CLI Canvas e helpers JSONL A2UI para `extensions/canvas/src/cli.ts`.
- Movidos o URL do host Canvas e helpers de capacidade com escopo para `extensions/canvas/src`.
- Movidos os padrões de comandos de nó do Canvas para fora de listas rígidas no núcleo e para `nodeInvokePolicies` do Plugin.
- Adicionada configuração de host Canvas pertencente ao Plugin em `plugins.entries.canvas.config.host`.
- Movido o serviço HTTP do Canvas e A2UI para trás do registro de rotas HTTP do Plugin Canvas.
- Adicionado despacho genérico de upgrade WebSocket de Plugin para rotas HTTP pertencentes a Plugins.
- Substituídos o URL de host Gateway específico do Canvas e a autenticação de capacidade de nó por superfície genérica de Plugin hospedado e helpers de capacidade de nó.
- Adicionados resolvedores de mídia hospedada pertencentes ao Plugin, para que URLs de documentos Canvas sejam resolvidos pelo Plugin Canvas em vez de o núcleo importar detalhes internos de documentos Canvas.
- Adicionado `api.registerNodeCliFeature(...)`, para que o Canvas possa declarar `openclaw nodes canvas` como um recurso de nó pertencente ao Plugin sem soletrar manualmente o caminho do comando pai.
- Removidas importações de produção `src/**` de `extensions/canvas/runtime-api.js`.
- Movida a fonte do bundle A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` para `extensions/canvas/src/host/a2ui-app`.
- Movida a implementação de build/cópia A2UI para `extensions/canvas/scripts` e substituída a fiação de build raiz por hooks genéricos de assets de Plugins integrados.
- Removido o alias legado de runtime de configuração de nível superior `canvasHost`.
- Mantida a migração do doctor do Canvas para que `openclaw doctor --fix` reescreva configurações antigas de `canvasHost` para `plugins.entries.canvas.config.host`.
- Removida a compatibilidade de protocolo Canvas de agentes antigos atrás do protocolo Gateway v4. Clientes nativos e Gateways agora usam somente `pluginSurfaceUrls.canvas` mais `node.pluginSurface.refresh`; o caminho obsoleto `canvasHostUrl`, `canvasCapability` e `node.canvas.capability.refresh` é intencionalmente sem suporte nesta refatoração experimental.
- Atualizado o inventário gerado de Plugins para incluir Canvas.
- Adicionada documentação de referência do Plugin em `docs/plugins/reference/canvas.md`.

Superfícies Canvas conhecidas que ainda pertencem ao núcleo:

- handlers Canvas do app nativo em `apps/` ainda consomem intencionalmente a superfície do Plugin Canvas
- handlers de protocolo/cliente Canvas do app nativo em `apps/`
- a saída do artefato publicado ainda usa `dist/canvas-host/a2ui` para busca de runtime compatível com versões anteriores, mas a etapa de cópia agora pertence ao Plugin

## Forma alvo

`extensions/canvas` deve possuir:

- manifesto do Plugin e metadados do pacote
- registro de ferramenta do agente
- política de comando de invocação de nó
- host Canvas e runtime A2UI
- fonte do bundle Canvas A2UI e scripts de build/cópia de assets
- criação de documentos Canvas e resolução de assets
- implementação da CLI Canvas
- página de documentação do Canvas e entrada no inventário de Plugins

O núcleo deve possuir apenas seams genéricos:

- descoberta e registro de Plugins
- registro genérico de ferramentas de agente
- registro genérico de políticas de invocação de nó
- HTTP/autenticação genéricos do Gateway e despacho de upgrade WebSocket
- resolução genérica de URL de superfície de Plugin hospedado
- registro genérico de resolvedor de mídia hospedada
- transporte genérico de capacidade de nó
- infraestrutura genérica de configuração
- descoberta genérica de hooks de assets de Plugins integrados

Apps nativos podem manter handlers de comando Canvas como clientes do protocolo. Eles não são os proprietários do runtime do Plugin.

## Etapas de migração

1. Tratar `plugins.entries.canvas.config.host` como a superfície de configuração pertencente ao Plugin.
2. Atualizar a documentação para que o Canvas seja descrito como um Plugin integrado experimental.
3. Executar testes focados do Canvas, verificações de inventário de Plugins, verificações da API do SDK de Plugin e gates de build/tipos afetados pelos limites de runtime.

## Checklist de auditoria

Antes de considerar a refatoração concluída:

- `rg "src/canvas-host|../canvas-host"` não retorna importações de fonte ativas.
- `rg "canvas-tool|createCanvasTool" src` não encontra implementação de ferramenta Canvas pertencente ao núcleo.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` não encontra padrões de allowlist rígidos fora de testes genéricos de política de Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` está vazio.
- `rg "canvas-documents" src` está vazio.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` está vazio; o Plugin Canvas registra `openclaw nodes canvas` por meio de metadados aninhados de CLI de Plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` não retorna propriedade de runtime do Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` encontra somente wrappers de compatibilidade ou caminhos pertencentes ao Plugin.
- `pnpm plugins:inventory:check` passa.
- `pnpm plugin-sdk:api:check` passa, ou os baselines de API gerados são atualizados e revisados intencionalmente.
- Testes Canvas direcionados passam.
- Testes de lanes alteradas passam para caminhos Canvas host/A2UI.
- O corpo do PR diz explicitamente que o Canvas é experimental e respaldado por Plugin.

## Comandos de verificação

Use verificações locais direcionadas durante a iteração:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Execute `pnpm build` antes do push se o barril de runtime, importação lazy, empacotamento ou superfícies publicadas do Plugin mudarem.
