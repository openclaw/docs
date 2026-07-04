---
read_when:
    - Executando `pnpm openclaw qa matrix` localmente
    - Adicionando ou selecionando cenários de QA do Matrix
    - Triando falhas, timeouts ou limpeza travada do Matrix QA
summary: 'Referência do mantenedor para a faixa de QA ao vivo do Matrix com suporte do Docker: CLI, perfis, variáveis de ambiente, cenários e artefatos de saída.'
title: Matriz de QA
x-i18n:
    generated_at: "2026-07-04T20:28:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

A linha de QA do Matrix executa o Plugin `@openclaw/matrix` incluído contra um homeserver Tuwunel descartável no Docker, com contas temporárias de driver, SUT e observador, além de salas semeadas. Ela é a cobertura real, com transporte ao vivo, para Matrix.

Esta é uma ferramenta exclusiva para mantenedores. As versões empacotadas do OpenClaw omitem intencionalmente `qa-lab`, então `openclaw qa` só está disponível a partir de um checkout do código-fonte. Checkouts do código-fonte carregam o executor incluído diretamente - nenhuma etapa de instalação de Plugin é necessária.

Para um contexto mais amplo do framework de QA, consulte [visão geral de QA](/pt-BR/concepts/qa-e2e-automation).

## Início rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` simples executa `--profile all` e não para na primeira falha. Use `--profile fast --fail-fast` para um gate de release; divida o catálogo com `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ao executar todo o inventário em paralelo.

## O que a linha faz

1. Provisiona um homeserver Tuwunel descartável no Docker (imagem padrão `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome do servidor `matrix-qa.test`, porta `28008`) atrás de um gravador limitado de solicitações/respostas com redação.
2. Registra três usuários temporários - `driver` (envia tráfego de entrada), `sut` (a conta Matrix do OpenClaw em teste), `observer` (captura de tráfego de terceiros).
3. Semeia as salas exigidas pelos cenários selecionados (principal, threads, mídia, reinicialização, secundária, lista de permissões, E2EE, DM de verificação etc.).
4. Executa a sonda de protocolo `matrix-qa-v1`, neutra em relação ao substrato, contra o limite Tuwunel gravado. Testes unitários comprovam o contrato da sonda com o fixture de protocolo Matrix; o host canônico do adaptador de transporte de QA em [#99707](https://github.com/openclaw/openclaw/pull/99707) é responsável pela fiação real do alvo Crabline.
5. Inicia um Gateway filho do OpenClaw com o Plugin Matrix real restrito à conta SUT; `qa-channel` não é carregado no filho.
6. Executa cenários em sequência, observando eventos por meio dos clientes Matrix driver/observer e derivando expectativas de rota/estado a partir do tráfego gravado.
7. Encerra o homeserver, grava artefatos de relatório e evidências, então sai.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flags comuns

| Flag                  | Padrão                                        | Descrição                                                                                                                                                         |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Perfil de cenário. Consulte [Perfis](#profiles).                                                                                                                  |
| `--fail-fast`         | desativado                                    | Para após a primeira verificação ou cenário com falha.                                                                                                            |
| `--scenario <id>`     | -                                             | Executa apenas este cenário. Repetível. Consulte [Cenários](#scenarios).                                                                                          |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Onde relatórios, resumo, inventário de rota/estado, eventos observados e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raiz do repositório ao invocar a partir de um diretório de trabalho neutro.                                                                                       |
| `--sut-account <id>`  | `sut`                                         | ID da conta Matrix dentro da configuração do Gateway de QA.                                                                                                       |

### Flags de provedor

A linha usa um transporte Matrix real, mas o provedor de modelo é configurável:

| Flag                     | Padrão          | Descrição                                                                                                                                      |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` para despacho mock determinístico ou `live-frontier` para provedores frontier ao vivo. O alias legado `live-openai` ainda funciona. |
| `--model <ref>`          | padrão do provedor | Ref principal `provider/model`.                                                                                                                |
| `--alt-model <ref>`      | padrão do provedor | Ref alternativa `provider/model` quando cenários alternam no meio da execução.                                                                  |
| `--fast`                 | desativado       | Habilita o modo rápido do provedor quando houver suporte.                                                                                      |

O QA do Matrix não aceita `--credential-source` nem `--credential-role`. A linha provisiona usuários descartáveis localmente; não há pool de credenciais compartilhado para reservar.

## Perfis

O perfil selecionado decide quais cenários serão executados.

| Perfil          | Use para                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (padrão)  | Catálogo completo. Lento, mas exaustivo.                                                                                                                                                                                            |
| `fast`          | Subconjunto de gate de release que exercita o contrato de transporte ao vivo: canário, gate de menção, bloqueio por lista de permissões, formato de resposta, retomada após reinicialização, continuação de thread, isolamento de thread, observação de reação e entrega de metadados de aprovação de exec. |
| `transport`     | Cenários em nível de transporte para threads, DM, sala, autoentrada, menção/lista de permissões, aprovação e reações.                                                                                                               |
| `media`         | Cobertura de anexos de imagem, áudio, vídeo, PDF e EPUB.                                                                                                                                                                            |
| `e2ee-smoke`    | Cobertura mínima de E2EE - resposta criptografada básica, continuação de thread, sucesso de bootstrap.                                                                                                                              |
| `e2ee-deep`     | Cenários exaustivos de perda de estado, backup, chave e recuperação de E2EE.                                                                                                                                                        |
| `e2ee-cli`      | Cenários da CLI `openclaw matrix encryption setup` e `verify *` executados pelo harness de QA.                                                                                                                                       |

O mapeamento exato fica em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Cenários

A lista completa de IDs de cenário é a união `MatrixQaScenarioId` em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. As categorias incluem:

- threads - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- nível superior / DM / sala - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e progresso de ferramenta - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- mídia - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- roteamento - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reações - `matrix-reaction-*`
- aprovações - `matrix-approval-*` (metadados de exec/Plugin, fallback em partes, reações de negação, threads e roteamento `target: "both"`)
- reinicialização e repetição - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gate de menção, bot-para-bot e listas de permissões - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (resposta básica, continuação de thread, bootstrap, ciclo de vida de chave de recuperação, variantes de perda de estado, comportamento de backup do servidor, higiene de dispositivo, verificação SAS / QR / DM, reinicialização, redação de artefatos)
- CLI de E2EE - `matrix-e2ee-cli-*` (configuração de criptografia, configuração idempotente, falha de bootstrap, ciclo de vida da chave de recuperação, múltiplas contas, ida e volta de resposta do Gateway, autoverificação)

Passe `--scenario <id>` (repetível) para executar um conjunto escolhido manualmente; combine com `--profile all` para ignorar o gate de perfil.

## Variáveis de ambiente

| Variável                                | Padrão                                    | Efeito                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite superior rígido para toda a execução.                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite para a resposta canário inicial. A CI de lançamento aumenta isso em executores compartilhados para que um primeiro turno lento do Gateway não falhe antes do início da cobertura de cenários.    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Janela silenciosa para asserções negativas de ausência de resposta. Limitada a `≤` o tempo limite da execução.                                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite para o desmonte do Docker. As superfícies de falha incluem o comando de recuperação `docker compose ... down --remove-orphans`.                                                                 |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sobrescreve a imagem do servidor doméstico ao validar contra uma versão diferente do Tuwunel.                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ativado                                   | `0` silencia as linhas de progresso `[matrix-qa] ...` em stderr. `1` as força a ficar ativadas.                                                                                                        |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redigido                                  | `1` mantém o corpo da mensagem e `formatted_body` em `matrix-qa-observed-events.json`. O padrão redige para manter os artefatos de CI seguros.                                                         |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desativado                                | `1` pula o `process.exit` determinístico após a gravação do artefato. O padrão força a saída porque os manipuladores de criptografia nativa do matrix-js-sdk podem manter o loop de eventos ativo após a conclusão do artefato. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | não definido                              | Quando definido por um iniciador externo (por exemplo, `scripts/run-node.mjs`), o QA do Matrix reutiliza esse caminho de log em vez de iniciar seu próprio tee.                                        |

## Artefatos de saída

Gravados em `--output-dir`:

- `matrix-qa-report.md` - Relatório de protocolo em Markdown (o que passou, falhou, foi ignorado e por quê).
- `matrix-qa-summary.json` - Resumo estruturado adequado para análise por CI e dashboards.
- `matrix-qa-route-state-manifest.json` - Inventário dinâmico `matrix-qa-v1` indexado por id de cenário. Ele registra formas redigidas de rota/corpo, ordenação de solicitações, novas tentativas observadas, erros, continuidade de token de sincronização e famílias de estado de dispositivo/chave/mídia/backup observadas durante essa execução. Isso é evidência executável, não uma linha de base versionada.
- `matrix-qa-observed-events.json` - Eventos Matrix observados dos clientes de driver e observador. Corpos são redigidos, a menos que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadados de aprovação são resumidos com campos seguros selecionados e prévia de comando truncada.
- `matrix-qa-output.log` - stdout/stderr combinados da execução. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` estiver definido, o log do iniciador externo será reutilizado.

O diretório de saída padrão é `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, para que execuções sucessivas não sobrescrevam umas às outras.

## Dicas de triagem

- **A execução trava perto do fim:** os manipuladores de criptografia nativa do `matrix-js-sdk` podem sobreviver ao harness. O padrão força um `process.exit` limpo após a gravação do artefato; se você removeu a definição de `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espere que o processo continue ativo por algum tempo.
- **Erro de limpeza:** procure o comando de recuperação impresso (uma invocação `docker compose ... down --remove-orphans`) e execute-o manualmente para liberar a porta do servidor doméstico.
- **Janelas de asserção negativa instáveis na CI:** reduza `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (padrão 8 s) quando a CI estiver rápida; aumente-o em executores compartilhados lentos.
- **Precisa de corpos redigidos para um relatório de bug:** execute novamente com `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e anexe `matrix-qa-observed-events.json`. Trate o artefato resultante como sensível.
- **Versão diferente do Tuwunel:** aponte `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` para a versão em teste. A lane verifica apenas a imagem padrão fixada.

## Contrato de transporte ao vivo

Matrix é uma das três lanes de transporte ao vivo (Matrix, Telegram, Discord) que compartilham uma única lista de verificação de contrato definida em [Visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` continua sendo a suíte sintética ampla e intencionalmente não faz parte dessa matriz.

## Relacionados

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - pilha geral de QA e contrato de transporte ao vivo
- [Canal de QA](/pt-BR/channels/qa-channel) - adaptador de canal sintético para cenários respaldados pelo repositório
- [Testes](/pt-BR/help/testing) - executar testes e adicionar cobertura de QA
- [Matrix](/pt-BR/channels/matrix) - o Plugin de canal em teste
