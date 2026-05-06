---
read_when:
    - Executando pnpm openclaw qa matrix localmente
    - Adicionar ou selecionar cenários de QA do Matrix
    - Triagem de falhas de QA do Matrix, tempos limite ou limpeza travada
summary: 'Referência do mantenedor para a faixa de QA ao vivo da Matrix baseada em Docker: CLI, perfis, variáveis de ambiente, cenários e artefatos de saída.'
title: Matriz de QA
x-i18n:
    generated_at: "2026-05-06T05:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

A trilha de QA do Matrix executa o Plugin `@openclaw/matrix` incluído contra um homeserver Tuwunel descartável no Docker, com contas temporárias de driver, SUT e observador, além de salas semeadas. Ela é a cobertura ao vivo com transporte real para Matrix.

Esta é uma ferramenta apenas para mantenedores. As versões empacotadas do OpenClaw omitem intencionalmente `qa-lab`, então `openclaw qa` só está disponível a partir de um checkout do código-fonte. Checkouts do código-fonte carregam o runner incluído diretamente - nenhuma etapa de instalação de Plugin é necessária.

Para contexto mais amplo do framework de QA, consulte [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation).

## Início rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` simples executa `--profile all` e não para na primeira falha. Use `--profile fast --fail-fast` para um gate de release; fragmente o catálogo com `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ao executar o inventário completo em paralelo.

## O que a trilha faz

1. Provisiona um homeserver Tuwunel descartável no Docker (imagem padrão `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome do servidor `matrix-qa.test`, porta `28008`).
2. Registra três usuários temporários - `driver` (envia tráfego de entrada), `sut` (a conta Matrix do OpenClaw em teste), `observer` (captura de tráfego de terceiros).
3. Semeia as salas exigidas pelos cenários selecionados (principal, threading, mídia, reinicialização, secundária, allowlist, E2EE, DM de verificação etc.).
4. Inicia um Gateway filho do OpenClaw com o Plugin Matrix real escopado à conta SUT; `qa-channel` não é carregado no filho.
5. Executa cenários em sequência, observando eventos pelos clientes Matrix driver/observador.
6. Encerra o homeserver, grava artefatos de relatório e resumo, então sai.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flags comuns

| Flag                  | Padrão                                       | Descrição                                                                                                                |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Perfil de cenário. Consulte [Perfis](#profiles).                                                                        |
| `--fail-fast`         | desativado                                    | Para após a primeira verificação ou cenário com falha.                                                                   |
| `--scenario <id>`     | -                                             | Executa apenas este cenário. Repetível. Consulte [Cenários](#scenarios).                                                 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Onde relatórios, resumo, eventos observados e o log de saída são gravados. Caminhos relativos são resolvidos contra `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raiz do repositório ao invocar a partir de um diretório de trabalho neutro.                                               |
| `--sut-account <id>`  | `sut`                                         | ID da conta Matrix dentro da configuração do Gateway de QA.                                                              |

### Flags de provedor

A trilha usa um transporte Matrix real, mas o provedor de modelo é configurável:

| Flag                     | Padrão          | Descrição                                                                                                                                     |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` para despacho mock determinístico ou `live-frontier` para provedores frontier ao vivo. O alias legado `live-openai` ainda funciona. |
| `--model <ref>`          | padrão do provedor | Ref `provider/model` principal.                                                                                                               |
| `--alt-model <ref>`      | padrão do provedor | Ref `provider/model` alternativa quando cenários alternam no meio da execução.                                                                 |
| `--fast`                 | desativado       | Ativa o modo rápido do provedor quando compatível.                                                                                            |

O QA do Matrix não aceita `--credential-source` nem `--credential-role`. A trilha provisiona usuários descartáveis localmente; não há pool de credenciais compartilhado para locação.

## Perfis

O perfil selecionado decide quais cenários são executados.

| Perfil          | Use para                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (padrão)  | Catálogo completo. Lento, mas exaustivo.                                                                                                                                                                                            |
| `fast`          | Subconjunto de gate de release que exercita o contrato de transporte ao vivo: canário, gate por menção, bloqueio por allowlist, formato de resposta, retomada após reinicialização, follow-up em thread, isolamento de thread, observação de reações e entrega de metadados de aprovação de exec. |
| `transport`     | Cenários de threading, DM, sala, autojoin, menção/allowlist, aprovação e reações em nível de transporte.                                                                                                                            |
| `media`         | Cobertura de anexos de imagem, áudio, vídeo, PDF e EPUB.                                                                                                                                                                            |
| `e2ee-smoke`    | Cobertura mínima de E2EE - resposta criptografada básica, follow-up em thread, sucesso de bootstrap.                                                                                                                                |
| `e2ee-deep`     | Cenários exaustivos de perda de estado, backup, chaves e recuperação de E2EE.                                                                                                                                                       |
| `e2ee-cli`      | Cenários de CLI `openclaw matrix encryption setup` e `verify *` conduzidos pelo harness de QA.                                                                                                                                      |

O mapeamento exato fica em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Cenários

A lista completa de IDs de cenário é a união `MatrixQaScenarioId` em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. As categorias incluem:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- nível superior / DM / sala - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e progresso de ferramentas - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- mídia - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- roteamento - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reações - `matrix-reaction-*`
- aprovações - `matrix-approval-*` (metadados de exec/Plugin, fallback em partes, reações de negação, threads e roteamento `target: "both"`)
- reinicialização e replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gate por menção, bot para bot e allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (resposta básica, follow-up em thread, bootstrap, ciclo de vida da chave de recuperação, variantes de perda de estado, comportamento de backup do servidor, higiene de dispositivos, verificação por SAS / QR / DM, reinicialização, redação de artefatos)
- CLI de E2EE - `matrix-e2ee-cli-*` (configuração de criptografia, configuração idempotente, falha de bootstrap, ciclo de vida de chave de recuperação, várias contas, ida e volta de resposta do Gateway, autoverificação)

Passe `--scenario <id>` (repetível) para executar um conjunto escolhido manualmente; combine com `--profile all` para ignorar o gate por perfil.

## Variáveis de ambiente

| Variável                                | Padrão                                    | Efeito                                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite superior rígido para toda a execução.                                                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite para a resposta inicial do canário. A CI de release aumenta isso em runners compartilhados para que um primeiro turno lento do Gateway não falhe antes do início da cobertura do cenário.               |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Janela silenciosa para asserções negativas de ausência de resposta. Limitada a `≤` o timeout da execução.                                                                                                      |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite para o encerramento do Docker. Superfícies de falha incluem o comando de recuperação `docker compose ... down --remove-orphans`.                                                                         |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Substitui a imagem do homeserver ao validar contra uma versão diferente do Tuwunel.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ativado                                   | `0` silencia as linhas de progresso `[matrix-qa] ...` no stderr. `1` as força a ficarem ativadas.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ocultado                                  | `1` mantém o corpo da mensagem e `formatted_body` em `matrix-qa-observed-events.json`. O padrão oculta para manter os artefatos de CI seguros.                                                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desativado                                | `1` ignora o `process.exit` determinístico após a gravação do artefato. O padrão força a saída porque os handles de criptografia nativa do matrix-js-sdk podem manter o loop de eventos ativo após a conclusão do artefato. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | não definido                              | Quando definido por um inicializador externo (por exemplo, `scripts/run-node.mjs`), a QA do Matrix reutiliza esse caminho de log em vez de iniciar seu próprio tee.                                            |

## Artefatos de saída

Gravados em `--output-dir`:

- `matrix-qa-report.md` - Relatório de protocolo em Markdown (o que passou, falhou, foi ignorado e por quê).
- `matrix-qa-summary.json` - Resumo estruturado adequado para parsing de CI e dashboards.
- `matrix-qa-observed-events.json` - Eventos Matrix observados dos clientes driver e observador. Os corpos são ocultados, a menos que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; os metadados de aprovação são resumidos com campos seguros selecionados e prévia truncada do comando.
- `matrix-qa-output.log` - stdout/stderr combinados da execução. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` estiver definido, o log do inicializador externo será reutilizado.

O diretório de saída padrão é `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, para que execuções sucessivas não sobrescrevam umas às outras.

## Dicas de triagem

- **A execução trava perto do fim:** os handles de criptografia nativa do `matrix-js-sdk` podem sobreviver ao harness. O padrão força um `process.exit` limpo após a gravação do artefato; se você definiu `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espere que o processo permaneça ativo.
- **Erro de limpeza:** procure o comando de recuperação impresso (uma invocação `docker compose ... down --remove-orphans`) e execute-o manualmente para liberar a porta do homeserver.
- **Janelas instáveis de asserção negativa na CI:** reduza `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (padrão 8 s) quando a CI for rápida; aumente em runners compartilhados lentos.
- **Precisa de corpos ocultados para um relatório de bug:** execute novamente com `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e anexe `matrix-qa-observed-events.json`. Trate o artefato resultante como sensível.
- **Versão diferente do Tuwunel:** aponte `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` para a versão em teste. A lane verifica somente a imagem padrão fixada.

## Contrato de transporte ao vivo

Matrix é uma das três lanes de transporte ao vivo (Matrix, Telegram, Discord) que compartilham uma única checklist de contrato definida em [Visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` continua sendo a suíte sintética ampla e intencionalmente não faz parte dessa matriz.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - pilha geral de QA e contrato de transporte ao vivo
- [QA Channel](/pt-BR/channels/qa-channel) - adaptador de canal sintético para cenários baseados no repositório
- [Testes](/pt-BR/help/testing) - execução de testes e adição de cobertura de QA
- [Matrix](/pt-BR/channels/matrix) - o Plugin de canal em teste
