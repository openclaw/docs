---
read_when:
    - Movendo a propriedade do host, das ferramentas, dos comandos, da documentação ou do protocolo do Canvas
    - Auditando se o Canvas ainda pertence ao núcleo
    - Preparação ou revisão do PR do Plugin experimental Canvas
summary: Plano e lista de verificação de auditoria para remover o Canvas do núcleo e transferi-lo para um plugin experimental incluído.
title: Refatoração do plugin Canvas
x-i18n:
    generated_at: "2026-07-12T00:21:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refatoração do plugin Canvas

O Canvas tem pouco uso e é experimental. Trate-o como um plugin incluído, não como um recurso do núcleo. O núcleo pode manter a infraestrutura genérica de Gateway, Node, HTTP, autenticação, configuração e cliente nativo, mas o comportamento específico do Canvas deve ficar em `extensions/canvas`.

## Objetivo

Mover a responsabilidade pelo Canvas para `extensions/canvas`, preservando o comportamento atual de Node pareado:

- a ferramenta `canvas` voltada para o agente é registrada pelo plugin Canvas
- os comandos de Node do Canvas são permitidos somente quando o plugin Canvas os registra
- os arquivos de origem/hospedagem do A2UI ficam no plugin Canvas
- a materialização de documentos do Canvas fica no plugin Canvas
- a implementação do comando da CLI fica no plugin Canvas ou delega por meio de um barrel de runtime pertencente ao plugin
- a documentação e o inventário de plugins descrevem o Canvas como experimental e baseado em plugin

## Fora do escopo

- Não reprojete a interface do Canvas no aplicativo nativo nesta refatoração.
- Não remova o suporte ao protocolo/cliente do Canvas no iOS, Android ou macOS, a menos que uma decisão de produto separada determine que o Canvas deve ser excluído.
- Não crie uma estrutura ampla de serviços de plugin apenas para o Canvas, a menos que pelo menos outro plugin incluído precise da mesma interface.

## Estado atual da branch

Concluído:

- Adicionado o pacote de plugin incluído em `extensions/canvas`.
- Adicionado `extensions/canvas/openclaw.plugin.json`.
- Movida a ferramenta `canvas` do agente de `src/agents/tools/canvas-tool.ts` para `extensions/canvas/src/tool.ts`.
- Removido o registro de `createCanvasTool` pelo núcleo em `src/agents/openclaw-tools.ts`.
- Movida a implementação do host do Canvas de `src/canvas-host` para `extensions/canvas/src/host`.
- Mantido `extensions/canvas/runtime-api.ts` como o barrel de compatibilidade pertencente ao plugin para testes, empacotamento e auxiliares públicos externos do Canvas.
- Movida a materialização de documentos do Canvas de `src/gateway/canvas-documents.ts` para `extensions/canvas/src/documents.ts`.
- Movidas a implementação da CLI do Canvas e as funções auxiliares de JSONL do A2UI para `extensions/canvas/src/cli.ts`.
- Movidas as funções auxiliares de URL do host do Canvas e de recursos com escopo para `extensions/canvas/src`.
- Movidos os padrões de comandos de Node do Canvas das listas codificadas diretamente no núcleo para `nodeInvokePolicies` do plugin.
- Adicionada a configuração do host do Canvas pertencente ao plugin em `plugins.entries.canvas.config.host`.
- Movido o fornecimento HTTP do Canvas e do A2UI para trás do registro de rotas HTTP do plugin Canvas.
- Adicionado o encaminhamento genérico de upgrade de WebSocket de plugins para rotas HTTP pertencentes a plugins.
- Substituídas a URL do host e a autenticação de recursos de Node específicas do Canvas no Gateway por funções auxiliares genéricas de superfície hospedada de plugin e recursos de Node.
- Adicionados resolvedores de mídia hospedada pertencentes ao plugin para que as URLs de documentos do Canvas sejam resolvidas pelo plugin Canvas, em vez de o núcleo importar componentes internos de documentos do Canvas.
- Adicionado `api.registerNodeCliFeature(...)` para que o Canvas possa declarar `openclaw nodes canvas` como um recurso de Node pertencente ao plugin sem especificar manualmente o caminho do comando pai.
- Removidas as importações de produção de `extensions/canvas/runtime-api.js` em `src/**`.
- Movida a origem do pacote A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` para `extensions/canvas/src/host/a2ui-app`.
- Movida a implementação de compilação/cópia do A2UI para `extensions/canvas/scripts`, substituindo a integração de compilação na raiz por ganchos genéricos de recursos de plugins incluídos.
- Removido o alias legado de configuração `canvasHost` de nível superior no runtime.
- Mantida a migração do Canvas no doctor para que `openclaw doctor --fix` reescreva configurações antigas de `canvasHost` como `plugins.entries.canvas.config.host`.
- Removida a compatibilidade do protocolo do Canvas com agentes antigos no protocolo v4 do Gateway. Clientes nativos e gateways agora usam apenas `pluginSurfaceUrls.canvas` junto com `node.pluginSurface.refresh`; o caminho obsoleto `canvasHostUrl`, `canvasCapability` e `node.canvas.capability.refresh` não é intencionalmente compatível nesta refatoração experimental.
- Atualizado o inventário gerado de plugins para incluir o Canvas.
- Adicionada a documentação de referência do plugin em `docs/plugins/reference/canvas.md`.

Superfícies conhecidas do Canvas que ainda pertencem ao núcleo:

- Os manipuladores do Canvas nos aplicativos nativos em `apps/` ainda consomem intencionalmente a superfície do plugin Canvas
- manipuladores de protocolo/cliente do Canvas nos aplicativos nativos em `apps/`
- a saída do artefato publicado ainda usa `dist/canvas-host/a2ui` para uma consulta de runtime retrocompatível, mas a etapa de cópia agora pertence ao plugin

## Estrutura pretendida

`extensions/canvas` deve ser responsável por:

- manifesto do plugin e metadados do pacote
- registro da ferramenta do agente
- política de comandos de invocação de Node
- host do Canvas e runtime do A2UI
- origem do pacote A2UI do Canvas e scripts de compilação/cópia de recursos
- criação de documentos e resolução de recursos do Canvas
- implementação da CLI do Canvas
- página de documentação do Canvas e entrada no inventário de plugins

O núcleo deve ser responsável apenas por interfaces genéricas:

- descoberta e registro de plugins
- registro genérico de ferramentas do agente
- registro genérico de políticas de invocação de Node
- HTTP/autenticação genéricos do Gateway e encaminhamento de upgrade de WebSocket
- resolução genérica de URLs de superfícies hospedadas de plugins
- registro genérico de resolvedores de mídia hospedada
- transporte genérico de recursos de Node
- infraestrutura genérica de configuração
- descoberta genérica de ganchos de recursos de plugins incluídos

Os aplicativos nativos podem manter os manipuladores de comandos do Canvas como clientes do protocolo. Eles não são responsáveis pelo runtime do plugin.

## Etapas da migração

1. Trate `plugins.entries.canvas.config.host` como a superfície de configuração pertencente ao plugin.
2. Atualize a documentação para descrever o Canvas como um plugin incluído experimental.
3. Execute testes específicos do Canvas, verificações do inventário de plugins, verificações da API do SDK de plugins e as etapas de compilação/tipos afetadas pelos limites do runtime.

## Lista de verificação da auditoria

Antes de considerar a refatoração concluída:

- `rg "src/canvas-host|../canvas-host"` não retorna importações ativas no código-fonte.
- `rg "canvas-tool|createCanvasTool" src` não encontra nenhuma implementação da ferramenta Canvas pertencente ao núcleo.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` não encontra padrões de lista de permissões codificados diretamente fora dos testes genéricos de políticas de plugins.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` não retorna resultados.
- `rg "canvas-documents" src` não retorna resultados.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` não retorna resultados; o plugin Canvas registra `openclaw nodes canvas` por meio de metadados aninhados da CLI do plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` não retorna nenhuma responsabilidade de runtime do Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` encontra apenas wrappers de compatibilidade ou caminhos pertencentes ao plugin.
- `pnpm plugins:inventory:check` é aprovado.
- `pnpm plugin-sdk:api:check` é aprovado, ou as linhas de base geradas da API são atualizadas e revisadas intencionalmente.
- Os testes direcionados do Canvas são aprovados.
- Os testes das áreas alteradas são aprovados para os caminhos de host/A2UI do Canvas.
- O corpo do PR declara explicitamente que o Canvas é experimental e baseado em plugin.

## Comandos de verificação

Use verificações locais direcionadas durante as iterações:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Execute `pnpm build` antes de enviar se o barrel de runtime, a importação tardia, o empacotamento ou as superfícies publicadas do plugin forem alterados.
