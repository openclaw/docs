---
read_when:
    - Executando pnpm openclaw qa matrix localmente
    - Adição ou seleção de cenários de QA do Matrix
    - Triagem de falhas, tempos limite ou limpeza travada no QA do Matrix
summary: 'Referência para mantenedores da esteira de QA ao vivo do Matrix baseada em Docker: CLI, perfis, variáveis de ambiente, cenários e artefatos de saída.'
title: QA da Matrix
x-i18n:
    generated_at: "2026-07-11T23:55:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

A esteira de QA do Matrix executa o plugin `@openclaw/matrix` incluído em um homeserver Tuwunel descartável no Docker, com contas temporárias de driver, SUT e observador, além de salas predefinidas. Ela fornece a cobertura em ambiente real do transporte do Matrix.

Ferramenta exclusiva para mantenedores. As versões empacotadas do OpenClaw omitem o `qa-lab`; portanto, `openclaw qa` é executado somente a partir de um checkout do código-fonte, que carrega diretamente o executor incluído, sem nenhuma etapa de instalação de plugin.

Para obter um contexto mais amplo sobre o framework de QA, consulte a [visão geral de QA](/pt-BR/concepts/qa-e2e-automation).

## Início rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

O comando simples `pnpm openclaw qa matrix` executa `--profile all` e não para na primeira falha. Divida o inventário completo entre tarefas paralelas com `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## O que a esteira faz

1. Provisiona um homeserver Tuwunel descartável no Docker (imagem padrão `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome do servidor `matrix-qa.test`, porta `28008`) por trás de um gravador limitado de solicitações/respostas que oculta dados sensíveis.
2. Registra três usuários temporários: `driver` (envia tráfego de entrada), `sut` (a conta do Matrix do OpenClaw em teste) e `observer` (captura tráfego de terceiros).
3. Predefine as salas exigidas pelos cenários selecionados (principal, encadeamento, mídia, reinicialização, secundária, lista de permissões, E2EE, mensagem direta de verificação etc.).
4. Executa a sondagem de protocolo `matrix-qa-v1`, independente da infraestrutura subjacente, no limite registrado do Tuwunel. Os testes unitários comprovam o contrato da sondagem com o fixture do protocolo Matrix; o host canônico do adaptador de transporte de QA na [#99707](https://github.com/openclaw/openclaw/pull/99707) é responsável pela conexão com alvos reais do Crabline.
5. Inicia um Gateway filho do OpenClaw com o plugin real do Matrix restrito à conta do SUT.
6. Executa os cenários em sequência, observando eventos por meio dos clientes Matrix do driver/observador e derivando as expectativas de rota/estado do tráfego registrado.
7. Encerra o homeserver, grava os artefatos de relatório e evidências e, em seguida, termina.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Opções comuns

| Opção                 | Padrão                                        | Descrição                                                                                                                                                                         |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Perfil de cenários. Consulte [Perfis](#profiles).                                                                                                                                 |
| `--fail-fast`         | desativado                                    | Para após a primeira verificação ou cenário com falha.                                                                                                                            |
| `--scenario <id>`     | -                                             | Executa somente este cenário. Pode ser repetida. Consulte [Cenários](#scenarios).                                                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Local em que são gravados os relatórios, o resumo, o inventário de rotas/estados, os eventos observados e o log de saída. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raiz do repositório ao executar a partir de um diretório de trabalho neutro.                                                                                                      |
| `--sut-account <id>`  | `sut`                                         | ID da conta do Matrix na configuração do Gateway de QA.                                                                                                                           |

### Opções de provedor

A esteira usa um transporte real do Matrix, mas o provedor do modelo é configurável:

| Opção                    | Padrão             | Descrição                                                                                                                                                                                           |
| ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` para despacho simulado determinístico ou `live-frontier` para provedores de ponta em ambiente real. O alias legado `live-openai` ainda funciona.                                      |
| `--model <ref>`          | padrão do provedor | Referência principal `provider/model`.                                                                                                                                                              |
| `--alt-model <ref>`      | padrão do provedor | Referência alternativa `provider/model` para cenários que alternam durante a execução.                                                                                                              |
| `--fast`                 | desativado         | Ativa o modo rápido do provedor quando houver suporte.                                                                                                                                              |

O QA do Matrix não aceita `--credential-source` nem `--credential-role`. A esteira provisiona usuários descartáveis localmente; não há nenhum pool compartilhado de credenciais do qual obter uma concessão.

## Perfis

| Perfil          | Use para                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (padrão)  | Catálogo completo. Lento, mas abrangente.                                                                                                                                                                                                                         |
| `fast`          | Subconjunto de validação de versão que testa o contrato imperativo do transporte em ambiente real: restrição por menção, bloqueio por lista de permissões, formato de resposta, retomada após reinicialização, observação de reações, entrega de metadados de aprovação de execução e resposta E2EE básica. |
| `transport`     | Cenários de encadeamento, mensagem direta, sala, entrada automática, menção/lista de permissões, aprovação e reação no nível do transporte.                                                                                                                        |
| `media`         | Cobertura de anexos de imagem, áudio, vídeo, PDF e EPUB.                                                                                                                                                                                                          |
| `e2ee-smoke`    | Cobertura E2EE mínima: resposta criptografada básica, acompanhamento em thread e inicialização bem-sucedida.                                                                                                                                                       |
| `e2ee-deep`     | Cenários abrangentes de perda de estado, backup, chaves e recuperação de E2EE.                                                                                                                                                                                     |
| `e2ee-cli`      | Cenários da CLI `openclaw matrix encryption setup` e `verify *` executados por meio do ambiente de testes de QA.                                                                                                                                                   |

O mapeamento exato está em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Cenários

O adaptador compartilhado do Matrix expõe estes cenários YAML canônicos por meio de `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` permanece disponível por meio da seleção explícita `--scenario subagent-thread-spawn`,
mas não faz parte do conjunto compartilhado padrão do Matrix até que a comprovação em ambiente real da conclusão do processo filho esteja estável.

A lista restante de IDs de cenários imperativos é a união `MatrixQaScenarioId` em `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorias:

- encadeamento: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- nível superior / mensagem direta / sala: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e progresso de ferramentas: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- mídia: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- roteamento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reações: `matrix-reaction-*`
- aprovações: `matrix-approval-*` (metadados de execução/plugin, fallback em blocos, reações de negação, threads e roteamento com `target: "both"`)
- reinicialização e repetição: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- restrição por menção, comunicação entre bots e listas de permissões: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (resposta básica, acompanhamento em thread, inicialização, ciclo de vida da chave de recuperação, variantes de perda de estado, comportamento do backup no servidor, integridade dos dispositivos, verificação por SAS / QR / mensagem direta, reinicialização e ocultação de dados sensíveis nos artefatos)
- CLI de E2EE: `matrix-e2ee-cli-*` (configuração de criptografia, configuração idempotente, falha de inicialização, ciclo de vida da chave de recuperação, várias contas, ciclo completo de resposta do Gateway e autoverificação)

Passe `--scenario <id>` (pode ser repetida) para executar um conjunto escolhido manualmente; combine com `--profile all` para ignorar as restrições de perfil.

## Variáveis de ambiente

| Variável                                | Padrão                                    | Efeito                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite máximo rígido para toda a execução.                                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite para a resposta canário inicial. A CI de lançamento aumenta esse valor em executores compartilhados para que uma primeira interação lenta com o Gateway não falhe antes do início da cobertura dos cenários. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Janela de espera para asserções negativas de ausência de resposta. Limitada a `<=` o tempo limite da execução.                                                                                      |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite para o encerramento do Docker. As informações de falha incluem o comando de recuperação `docker compose ... down --remove-orphans`.                                                         |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Substitui a imagem do servidor doméstico ao validar com uma versão diferente do Tuwunel.                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ativado                                   | `0` oculta as linhas de progresso `[matrix-qa] ...` no stderr. `1` força sua exibição.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ocultado                                  | `1` mantém o corpo da mensagem e `formatted_body` em `matrix-qa-observed-events.json`. Por padrão, esses dados são ocultados para manter seguros os artefatos da CI.                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desativado                                | `1` ignora o `process.exit` determinístico após a gravação dos artefatos. Por padrão, a saída é forçada porque os manipuladores de criptografia nativos do matrix-js-sdk podem manter o loop de eventos ativo após a conclusão dos artefatos. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | não definido                              | Quando definido por um inicializador externo (por exemplo, `scripts/run-node.mjs`), o controle de qualidade do Matrix reutiliza esse caminho de log em vez de iniciar seu próprio tee.               |

## Artefatos de saída

Gravados em `--output-dir` (padrão `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, para que execuções sucessivas não sobrescrevam umas às outras):

- `matrix-qa-report.md`: relatório de protocolo em Markdown (o que passou, falhou, foi ignorado e por quê).
- `matrix-qa-summary.json`: resumo estruturado adequado para análise pela CI e para painéis.
- `matrix-qa-route-state-manifest.json`: inventário dinâmico `matrix-qa-v1` indexado por ID de cenário. Registra formatos ocultados de rotas e corpos, ordem das solicitações, novas tentativas observadas, erros, continuidade do token de sincronização e famílias de estados de dispositivo, chave, mídia e backup observadas durante a execução. Isso é evidência executável, não uma linha de base versionada no repositório.
- `matrix-qa-observed-events.json`: eventos do Matrix observados pelos clientes controlador e observador. Os corpos são ocultados, a menos que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; os metadados de aprovação são resumidos com campos seguros selecionados e uma prévia truncada do comando.
- `matrix-qa-output.log`: stdout/stderr combinados da execução. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` estiver definido, o log do inicializador externo será reutilizado.

## Dicas de triagem

- **A execução trava perto do fim:** os manipuladores de criptografia nativos do `matrix-js-sdk` podem permanecer ativos por mais tempo que o ambiente de testes. Por padrão, um `process.exit` limpo é forçado após a gravação dos artefatos; se você definir `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espere que o processo permaneça ativo.
- **Erro de limpeza:** procure o comando de recuperação exibido (uma invocação de `docker compose ... down --remove-orphans`) e execute-o manualmente para liberar a porta do servidor doméstico.
- **Janelas instáveis de asserção negativa na CI:** reduza `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (padrão de 8 s) quando a CI for rápida; aumente-o em executores compartilhados lentos.
- **Precisa de corpos ocultados para um relatório de bug:** execute novamente com `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e anexe `matrix-qa-observed-events.json`. Trate o artefato resultante como confidencial.
- **Versão diferente do Tuwunel:** defina `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` com a versão em teste. A faixa versiona apenas a imagem padrão fixada.

## Contrato de transporte em tempo real

O Matrix é uma das três faixas de transporte em tempo real (Matrix, Telegram e Discord) que compartilham uma única lista de verificação de contrato definida em [Visão geral do controle de qualidade: cobertura de transporte em tempo real](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` continua sendo a ampla suíte sintética e, intencionalmente, não faz parte dessa matriz.

## Relacionados

- [Visão geral do controle de qualidade](/pt-BR/concepts/qa-e2e-automation): pilha geral de controle de qualidade e contrato de transporte em tempo real
- [Canal de controle de qualidade](/pt-BR/channels/qa-channel): adaptador de canal sintético para cenários baseados no repositório
- [Testes](/pt-BR/help/testing): execução de testes e adição de cobertura de controle de qualidade
- [Matrix](/pt-BR/channels/matrix): o plugin de canal em teste
