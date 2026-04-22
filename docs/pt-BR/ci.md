---
read_when:
    - Você precisa entender por que um job de CI foi ou não foi executado
    - Você está depurando verificações com falha no GitHub Actions
summary: Grafo de jobs de CI, gates de escopo e equivalentes de comandos locais
title: Pipeline de CI
x-i18n:
    generated_at: "2026-04-22T04:21:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Pipeline de CI

A CI é executada em cada push para `main` e em todo pull request. Ela usa escopo inteligente para pular jobs caros quando apenas áreas não relacionadas foram alteradas.

## Visão geral dos jobs

| Job                              | Finalidade                                                                                   | Quando é executado                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detectar alterações somente em docs, escopos alterados, extensões alteradas e montar o manifesto de CI | Sempre em pushes e PRs que não são draft |
| `security-scm-fast`              | Detecção de chave privada e auditoria de workflow via `zizmor`                              | Sempre em pushes e PRs que não são draft |
| `security-dependency-audit`      | Auditoria do lockfile de produção sem dependências contra advisories do npm                 | Sempre em pushes e PRs que não são draft |
| `security-fast`                  | Agregado obrigatório para os jobs rápidos de segurança                                      | Sempre em pushes e PRs que não são draft |
| `build-artifacts`                | Compilar `dist/` e a UI de controle uma vez, enviar artefatos reutilizáveis para jobs downstream | Alterações relevantes para Node     |
| `checks-fast-core`               | Lanes rápidas de verificação no Linux, como verificações de plugin incluído/contrato de plugin/protocolo | Alterações relevantes para Node     |
| `checks-fast-contracts-channels` | Verificações fragmentadas de contratos de canal com um resultado agregado estável            | Alterações relevantes para Node     |
| `checks-node-extensions`         | Shards completos de teste de plugin incluído em toda a suíte de extensões                   | Alterações relevantes para Node     |
| `checks-node-core-test`          | Shards de testes centrais de Node, excluindo canais, plugins incluídos, contratos e lanes de extensões | Alterações relevantes para Node     |
| `extension-fast`                 | Testes focados apenas nos plugins incluídos alterados                                       | Quando alterações em extensões são detectadas |
| `check`                          | Equivalente principal local fragmentado: tipos de prod, lint, guardas, tipos de teste e smoke estrito | Alterações relevantes para Node     |
| `check-additional`               | Guardas de arquitetura, limites, superfície de extensões, limites de pacote e shards de gateway-watch | Alterações relevantes para Node     |
| `build-smoke`                    | Testes smoke da CLI compilada e smoke de memória na inicialização                           | Alterações relevantes para Node     |
| `checks`                         | Lanes Linux Node restantes: testes de canal e compatibilidade Node 22 somente para push     | Alterações relevantes para Node     |
| `check-docs`                     | Formatação, lint e verificação de links quebrados na documentação                           | Quando docs forem alteradas         |
| `skills-python`                  | Ruff + pytest para Skills com backend em Python                                             | Alterações relevantes para Skills em Python |
| `checks-windows`                 | Lanes de teste específicas do Windows                                                       | Alterações relevantes para Windows  |
| `macos-node`                     | Lane de testes TypeScript no macOS usando os artefatos compilados compartilhados            | Alterações relevantes para macOS    |
| `macos-swift`                    | Lint, build e testes Swift para o app macOS                                                 | Alterações relevantes para macOS    |
| `android`                        | Matriz de build e testes do Android                                                         | Alterações relevantes para Android  |

## Ordem de fail-fast

Os jobs são ordenados para que verificações baratas falhem antes de as caras serem executadas:

1. `preflight` decide quais lanes existem de fato. A lógica de `docs-scope` e `changed-scope` são etapas dentro deste job, não jobs independentes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falham rapidamente sem esperar os jobs mais pesados de artefatos e matriz de plataforma.
3. `build-artifacts` se sobrepõe às lanes rápidas de Linux para que consumidores downstream possam começar assim que o build compartilhado estiver pronto.
4. Depois disso, as lanes mais pesadas de plataforma e runtime se expandem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

A lógica de escopo fica em `scripts/ci-changed-scope.mjs` e é coberta por testes unitários em `src/scripts/ci-changed-scope.test.ts`.
O workflow separado `install-smoke` reutiliza o mesmo script de escopo por meio do seu próprio job `preflight`. Ele calcula `run_install_smoke` a partir do sinal mais restrito de smoke alterado, então o smoke de Docker/instalação só é executado para alterações relevantes de instalação, empacotamento e contêiner.

A lógica local de lanes alteradas fica em `scripts/changed-lanes.mjs` e é executada por `scripts/check-changed.mjs`. Esse gate local é mais rigoroso quanto aos limites de arquitetura do que o amplo escopo de plataforma da CI: alterações de produção no core executam typecheck de produção do core mais testes do core, alterações somente em testes do core executam apenas typecheck/testes de testes do core, alterações de produção em extensões executam typecheck de produção de extensões mais testes de extensões, e alterações somente em testes de extensões executam apenas typecheck/testes de testes de extensões. Alterações no SDK público de Plugin ou no contrato de plugin expandem para validação de extensões porque as extensões dependem desses contratos centrais. Bumps de versão somente em metadados de release executam verificações direcionadas de versão/configuração/dependências de raiz. Alterações desconhecidas na raiz/configuração falham para o modo seguro em todas as lanes.

Em pushes, a matriz `checks` adiciona a lane `compat-node22`, exclusiva de push. Em pull requests, essa lane é ignorada e a matriz permanece focada nas lanes normais de teste/canal.

As famílias de testes Node mais lentas são divididas em shards por arquivo incluído para que cada job permaneça pequeno: contratos de canal dividem cobertura de registro e do core em oito shards ponderados cada, testes de comando de resposta de resposta automática se dividem em quatro shards por padrão de inclusão, e os outros grandes grupos de prefixo de resposta automática se dividem em dois shards cada. `check-additional` também separa trabalho de compilação/canary de limite de pacote do trabalho de topologia de runtime de gateway/arquitetura.

O GitHub pode marcar jobs substituídos como `cancelled` quando um push mais novo chega ao mesmo PR ou ref `main`. Trate isso como ruído de CI, a menos que a execução mais recente para a mesma ref também esteja falhando. As verificações agregadas de shard destacam explicitamente esse caso de cancelamento para facilitar a distinção de uma falha de teste.

## Runners

| Runner                           | Jobs                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, verificações Linux, verificações de docs, Skills em Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` em `openclaw/openclaw`; forks usam `macos-latest` como fallback                                                        |

## Equivalentes locais

```bash
pnpm changed:lanes   # inspeciona o classificador local de lanes alteradas para origin/main...HEAD
pnpm check:changed   # gate local inteligente: changed typecheck/lint/tests por lane de limite
pnpm check          # gate local rápido: tsgo de produção + lint fragmentado + guardas rápidos em paralelo
pnpm check:test-types
pnpm check:timed    # mesmo gate com tempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testes vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatação + lint + links quebrados nas docs
pnpm build          # compila dist quando as lanes de artefato/build-smoke da CI importam
```
