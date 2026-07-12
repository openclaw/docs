---
read_when:
    - Executando pnpm openclaw qa matrix localmente
    - Adição ou seleção de cenários de QA do Matrix
    - Triagem de falhas de QA, tempos limite ou limpeza travada no Matrix
summary: 'Referência para mantenedores da esteira de QA ao vivo do Matrix com suporte do Docker: CLI, perfis, variáveis de ambiente, cenários e artefatos de saída.'
title: QA do Matrix
x-i18n:
    generated_at: "2026-07-12T15:07:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

A trilha de QA do Matrix executa o plugin `@openclaw/matrix` incluído em um homeserver Tuwunel descartável no Docker, com contas temporárias de driver, SUT e observador, além de salas pré-configuradas. Ela fornece a cobertura real, em ambiente ativo, do transporte do Matrix.

Ferramentas exclusivas para mantenedores. As versões empacotadas do OpenClaw omitem o `qa-lab`; portanto, `openclaw qa` só é executado a partir de um checkout do código-fonte, que carrega diretamente o executor incluído, sem etapa de instalação do plugin.

Para obter um contexto mais amplo sobre o framework de QA, consulte a [visão geral de QA](/pt-BR/concepts/qa-e2e-automation).

## Início rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A execução simples de `pnpm openclaw qa matrix` usa `--profile all` e não é interrompida na primeira falha. Distribua o inventário completo entre tarefas paralelas com `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## O que a trilha faz

1. Provisiona um homeserver Tuwunel descartável no Docker (imagem padrão `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome do servidor `matrix-qa.test`, porta `28008`) por trás de um gravador limitado de solicitações e respostas com redação de dados sensíveis.
2. Registra três usuários temporários: `driver` (envia tráfego de entrada), `sut` (a conta do Matrix no OpenClaw que está sendo testada) e `observer` (captura tráfego de terceiros).
3. Pré-configura as salas exigidas pelos cenários selecionados (principal, conversas em thread, mídia, reinicialização, secundária, lista de permissões, E2EE, mensagem direta de verificação etc.).
4. Executa a sondagem de protocolo `matrix-qa-v1`, independente do substrato, no limite registrado do Tuwunel. Testes unitários comprovam o contrato da sondagem com o fixture do protocolo Matrix; o host canônico do adaptador de transporte de QA em [#99707](https://github.com/openclaw/openclaw/pull/99707) é responsável pela conexão com destinos reais do Crabline.
5. Inicia um gateway filho do OpenClaw com o plugin real do Matrix restrito à conta SUT.
6. Executa os cenários em sequência, observa os eventos por meio dos clientes Matrix do driver e do observador e deriva as expectativas de rota e estado do tráfego registrado.
7. Encerra o homeserver, grava os artefatos de relatório e evidências e, em seguida, finaliza.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Opções comuns

| Opção                 | Padrão                                        | Descrição                                                                                                                                                                        |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Perfil de cenários. Consulte [Perfis](#profiles).                                                                                                                                |
| `--fail-fast`         | desativado                                    | Interrompe após a primeira verificação ou o primeiro cenário com falha.                                                                                                          |
| `--scenario <id>`     | -                                             | Executa apenas este cenário. Pode ser repetido. Consulte [Cenários](#scenarios).                                                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Local em que são gravados os relatórios, o resumo, o inventário de rotas/estados, os eventos observados e o log de saída. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raiz do repositório ao executar a partir de um diretório de trabalho neutro.                                                                                                     |
| `--sut-account <id>`  | `sut`                                         | ID da conta do Matrix na configuração do gateway de QA.                                                                                                                          |

### Opções do provedor

A trilha usa um transporte real do Matrix, mas o provedor do modelo é configurável:

| Opção                    | Padrão             | Descrição                                                                                                                                                                                    |
| ------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` para despacho simulado determinístico ou `live-frontier` para provedores de fronteira ativos. O alias legado `live-openai` continua funcionando.                                |
| `--model <ref>`          | padrão do provedor | Referência principal `provider/model`.                                                                                                                                                        |
| `--alt-model <ref>`      | padrão do provedor | Referência alternativa `provider/model` usada quando os cenários alternam durante a execução.                                                                                                 |
| `--fast`                 | desativado         | Ativa o modo rápido do provedor quando houver suporte.                                                                                                                                        |

O QA do Matrix não aceita `--credential-source` nem `--credential-role`. A trilha provisiona usuários descartáveis localmente; não há um pool compartilhado de credenciais do qual obter uma concessão.

## Perfis

| Perfil          | Use para                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (padrão)  | Catálogo completo. Lento, mas abrangente.                                                                                                                                                                                                     |
| `fast`          | Subconjunto da verificação de lançamento que exercita o contrato imperativo do transporte ativo: controle por menções, bloqueio por lista de permissões, formato de resposta, retomada após reinicialização, observação de reações, entrega de metadados de aprovação de execução e resposta E2EE básica. |
| `transport`     | Cenários de conversas em thread, mensagens diretas, salas, entrada automática, menções/listas de permissões, aprovações e reações no nível de transporte.                                                                                       |
| `media`         | Cobertura de anexos de imagem, áudio, vídeo, PDF e EPUB.                                                                                                                                                                                       |
| `e2ee-smoke`    | Cobertura E2EE mínima: resposta criptografada básica, acompanhamento em thread e bootstrap bem-sucedido.                                                                                                                                       |
| `e2ee-deep`     | Cenários abrangentes de perda de estado, backup, chaves e recuperação de E2EE.                                                                                                                                                                 |
| `e2ee-cli`      | Cenários da CLI `openclaw matrix encryption setup` e `verify *` conduzidos pelo harness de QA.                                                                                                                                                 |

O mapeamento exato está em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Cenários

O adaptador compartilhado do Matrix expõe estes cenários YAML canônicos por meio de `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` continua disponível por meio da seleção explícita `--scenario subagent-thread-spawn`,
mas não faz parte do conjunto compartilhado padrão do Matrix até que a comprovação de conclusão de filhos em ambiente ativo esteja estável.

A lista restante de IDs de cenários imperativos é a união `MatrixQaScenarioId` em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorias:

- conversas em thread: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- nível superior / mensagem direta / sala: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e progresso de ferramentas: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- mídia: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- roteamento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reações: `matrix-reaction-*`
- aprovações: `matrix-approval-*` (metadados de execução/plugin, fallback em partes, reações de negação, threads e roteamento com `target: "both"`)
- reinicialização e reprodução: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- controle por menções, comunicação entre bots e listas de permissões: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (resposta básica, acompanhamento em thread, bootstrap, ciclo de vida da chave de recuperação, variantes de perda de estado, comportamento do backup no servidor, higiene de dispositivos, verificação por SAS / QR / mensagem direta, reinicialização e redação de artefatos)
- CLI de E2EE: `matrix-e2ee-cli-*` (configuração de criptografia, configuração idempotente, falha de bootstrap, ciclo de vida da chave de recuperação, várias contas, ida e volta da resposta do gateway e autoverificação)

Passe `--scenario <id>` (pode ser repetido) para executar um conjunto selecionado manualmente; combine com `--profile all` para ignorar o controle por perfil.

## Variáveis de ambiente

| Variável                                | Padrão                                    | Efeito                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite máximo rígido para a execução inteira.                                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite para a resposta canário inicial. A CI de lançamento aumenta esse valor em executores compartilhados para que uma primeira interação lenta com o Gateway não cause falha antes do início da cobertura dos cenários. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Janela de inatividade para asserções negativas de ausência de resposta. Limitada a `<=` o tempo limite da execução.                                                                            |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite para o encerramento do Docker. As informações de falha incluem o comando de recuperação `docker compose ... down --remove-orphans`.                                                     |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Substitui a imagem do homeserver ao validar com uma versão diferente do Tuwunel.                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ativado                                   | `0` silencia as linhas de progresso `[matrix-qa] ...` no stderr. `1` força sua exibição.                                                                                                       |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | suprimido                                 | `1` mantém o corpo da mensagem e `formatted_body` em `matrix-qa-observed-events.json`. Por padrão, esses dados são suprimidos para manter seguros os artefatos de CI.                            |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desativado                                | `1` ignora o `process.exit` determinístico após a gravação do artefato. Por padrão, a saída é forçada porque os identificadores de criptografia nativa do matrix-js-sdk podem manter o loop de eventos ativo após a conclusão do artefato. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | não definido                              | Quando definido por um inicializador externo (por exemplo, `scripts/run-node.mjs`), o QA do Matrix reutiliza esse caminho de log em vez de iniciar seu próprio tee.                             |

## Artefatos de saída

Gravados em `--output-dir` (padrão `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, para que execuções sucessivas não sobrescrevam umas às outras):

- `matrix-qa-report.md`: relatório de protocolo em Markdown (o que passou, falhou, foi ignorado e por quê).
- `matrix-qa-summary.json`: resumo estruturado adequado para análise pela CI e painéis.
- `matrix-qa-route-state-manifest.json`: inventário dinâmico `matrix-qa-v1` indexado por ID de cenário. Registra formatos suprimidos de rotas/corpos, ordem das solicitações, novas tentativas observadas, erros, continuidade de tokens de sincronização e famílias de estados de dispositivo/chave/mídia/backup observadas durante essa execução. Trata-se de evidência executável, não de uma linha de base versionada.
- `matrix-qa-observed-events.json`: eventos do Matrix observados nos clientes de driver e observador. Os corpos são suprimidos, a menos que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; os metadados de aprovação são resumidos com campos seguros selecionados e uma prévia truncada do comando.
- `matrix-qa-output.log`: stdout/stderr combinados da execução. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` estiver definido, o log do inicializador externo será reutilizado.

## Dicas de triagem

- **A execução trava perto do fim:** os identificadores de criptografia nativa do `matrix-js-sdk` podem permanecer ativos por mais tempo que o harness. Por padrão, um `process.exit` limpo é forçado após a gravação do artefato; se você definir `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espere que o processo permaneça ativo.
- **Erro de limpeza:** procure o comando de recuperação exibido (uma invocação de `docker compose ... down --remove-orphans`) e execute-o manualmente para liberar a porta do homeserver.
- **Janelas instáveis de asserções negativas na CI:** reduza `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (padrão de 8 s) quando a CI for rápida; aumente-o em executores compartilhados lentos.
- **Precisa de corpos suprimidos para um relatório de bug:** execute novamente com `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e anexe `matrix-qa-observed-events.json`. Trate o artefato resultante como sensível.
- **Versão diferente do Tuwunel:** aponte `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` para a versão em teste. A faixa inclui somente a imagem padrão fixada.

## Contrato de transporte ativo

O Matrix é uma das três faixas de transporte ativo (Matrix, Telegram e Discord) que compartilham uma única lista de verificação de contrato definida em [Visão geral do QA: cobertura de transporte ativo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` continua sendo a suíte sintética abrangente e, intencionalmente, não faz parte dessa matriz.

## Relacionados

- [Visão geral do QA](/pt-BR/concepts/qa-e2e-automation): pilha geral de QA e contrato de transporte ativo
- [Canal de QA](/pt-BR/channels/qa-channel): adaptador de canal sintético para cenários baseados no repositório
- [Testes](/pt-BR/help/testing): execução de testes e adição de cobertura de QA
- [Matrix](/pt-BR/channels/matrix): o plugin de canal em teste
