---
read_when:
    - Criação ou execução de QA visual ao vivo para bugs do OpenClaw
    - Adição de verificação antes e depois para uma pull request
    - Adição de cenários de transporte em tempo real do Discord, Slack, WhatsApp ou outros serviços
    - Executando uma verificação focada da Control UI no navegador para uma referência candidata
    - Depuração de execuções de QA que exigem capturas de tela, automação do navegador ou acesso VNC
summary: O Mantis captura evidências visuais de ponta a ponta para comparações de transporte em tempo real e provas focadas no navegador somente para candidatos e, em seguida, anexa os artefatos aos PRs.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T12:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

O Mantis publica evidências visuais de CI e um comentário no PR sobre o comportamento do OpenClaw.
Os cenários de transporte em tempo real comparam uma linha de base comprovadamente defeituosa com uma referência candidata;
fluxos de navegador focados podem, em vez disso, validar uma candidata em relação a um transporte simulado
determinístico. O Discord foi disponibilizado primeiro, com autenticação real de bot, canais de servidor,
reações, threads e uma testemunha no navegador. Também existem fluxos para Slack, Telegram e chats focados da
interface de controle; WhatsApp e Matrix ainda não foram implementados.

## Responsabilidades

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime de cenários, CLI `pnpm openclaw qa mantis <command>`, esquema de evidências.
- Laboratório de QA (`extensions/qa-lab/src/live-transports/*`): infraestrutura de transporte em tempo real, bots de driver/SUT, geradores de relatórios/evidências.
- Crabbox (`openclaw/crabbox`): máquinas Linux pré-aquecidas, concessões, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): pontos de entrada remotos, retenção de artefatos.
- ClawSweeper: analisa comandos de mantenedores em PRs, aciona fluxos de trabalho e publica o comentário final no PR.

## Comandos da CLI

Todos os comandos são `pnpm openclaw qa mantis <command>`, definidos em
`extensions/qa-lab/src/mantis/cli.ts`. Requer `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante a compilação/execução (os fluxos de trabalho incluídos definem `OPENCLAW_BUILD_PRIVATE_QA=1` e
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes da compilação).

| Comando                         | Finalidade                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verificar se o bot Mantis do Discord consegue ver o servidor/canal, publicar e reagir.                                                                                 |
| `run`                           | Executar um cenário antes/depois com referências de linha de base e candidata (somente Discord).                                                                           |
| `desktop-browser-smoke`         | Conceder/reutilizar um desktop Crabbox, abrir um navegador visível e capturar captura de tela + vídeo.                                                                        |
| `slack-desktop-smoke`           | Conceder/reutilizar um desktop Crabbox, executar o QA do Slack nele, abrir o Slack Web e capturar evidências.                                                                  |
| `telegram-desktop-builder`      | Conceder/reutilizar um desktop Crabbox, instalar o Telegram Desktop e, opcionalmente, configurar um Gateway do OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Captura genérica de desktop Crabbox com asserções opcionais de compreensão de imagens; `visual-driver` é a metade do driver iniciada em `crabbox record --while`. |

Todos os comandos aceitam `--repo-root <path>` e `--output-dir <path>`; os comandos do Crabbox
também aceitam `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` e `--keep-lease`. Os padrões locais da CLI
para provedor/classe são `hetzner`/`beast`, salvo indicação em contrário; os fluxos de trabalho de CI
normalmente substituem ambos.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Chama a API REST do Discord (`https://discord.com/api/v10`) para obter o usuário
do bot, o servidor, os canais do servidor e o canal de destino; verifica se o
canal pertence ao servidor e, em seguida, (a menos que `--skip-post`) publica uma mensagem e
adiciona uma reação `👀`. Grava `mantis-discord-smoke-summary.json` e
`mantis-discord-smoke-report.md`.

Ordem de resolução do token: valor de `--token-file`, depois `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(substitua com `--token-env`) e, por fim, um arquivo indicado por `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(substitua com `--token-file-env`). Os IDs de servidor/canal vêm de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (substitua com
`--guild-id` / `--channel-id`) e devem ser snowflakes do Discord com 17-20 dígitos. Defina
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para substituir IDs e nomes de bot/servidor/canal/mensagem
por `<redacted>` no resumo e relatório publicados.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` atualmente aceita apenas `discord`. `--scenario` é um dos dois
IDs integrados, cada um com sua própria referência de linha de base padrão e seus próprios rótulos esperados de antes/depois
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Cenário                                   | Linha de base padrão                           | Expectativa da linha de base                         | Expectativa da candidata            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | a resposta na thread omite o anexo `filePath` | a resposta na thread o inclui     |

`--candidate` usa `HEAD` por padrão. Outras opções: `--credential-source`
(padrão `convex`), `--credential-role` (padrão `ci`), `--provider-mode`
(padrão `live-frontier`), `--fast` (ativada por padrão), `--skip-install`, `--skip-build`.

O executor cria checkouts `git worktree` desanexados para a linha de base e a
candidata em `<output-dir>/worktrees/`, executa `pnpm install`/`pnpm build` em
cada um (a menos que ignorados) e, em seguida, executa
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
em cada árvore de trabalho. Cada fluxo grava `discord-qa-reaction-timelines.json`
e um par `<scenario-id>-timeline.html`/`.png`; o executor copia essas
evidências de volta para `baseline/`/`candidate/`, grava `comparison.json`,
`mantis-report.md` e `mantis-evidence.json` no diretório de saída e
encerra com código diferente de zero se a comparação não for aprovada (linha de base `fail` e candidata
`pass`).

O segundo cenário do Discord (`discord-thread-reply-filepath-attachment`) publica
uma mensagem principal com o bot de driver, cria uma thread real, chama a ação
`message.thread-reply` do SUT com um `filePath` local do repositório e, em seguida, consulta
a thread repetidamente em busca da resposta e do nome do arquivo anexado. Ele espera um anexo
chamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Concede ou reutiliza um desktop Crabbox, inicia um navegador dentro da sessão VNC
apontado para `--browser-url` (padrão `https://openclaw.ai`) ou um
`--html-file` renderizado, aguarda, captura uma tela com `scrot`, opcionalmente grava um MP4 com
`ffmpeg` e sincroniza via rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de volta para `--output-dir`.

Opções:

- `--lease-id <cbx_...>` reutiliza um desktop pré-aquecido em vez de criar um.
- `--browser-profile-dir <remote-path>` reutiliza um diretório de dados de usuário remoto do Chrome para que um desktop persistente permaneça conectado entre execuções (usado para um perfil duradouro de visualização do Discord Web).
- `--browser-profile-archive-env <name>` restaura, antes da inicialização, um arquivo de perfil do Chrome `.tgz` em base64 dessa variável de ambiente (padrão `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); usado para testemunhas conectadas, como o Discord Web.
- `--video-duration <seconds>` controla a duração da captura MP4 (padrão 10s).
- `--keep-lease` (ou `OPENCLAW_MANTIS_KEEP_VM=1`) mantém aberta para inspeção por VNC uma concessão criada por esta execução; por padrão, execuções com falha que criaram uma concessão também a mantêm.

Para evidências do Discord Web, o Mantis usa uma conta dedicada de visualização, não um token
de bot. O oráculo REST do Discord (via `qa discord`) continua sendo a fonte definitiva; quando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também grava um
artefato de URL do Discord Web, e `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` mantém a
thread aberta por tempo suficiente para o navegador abri-la.

O fluxo de trabalho do GitHub prefere um perfil persistente de visualização via
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (arquivos completos de perfil podem ultrapassar
o limite de tamanho de segredos do GitHub); para perfis pequenos/de inicialização, pode restaurar um
`.tgz` em base64 de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Sem
nenhuma das fontes configuradas, o fluxo de trabalho ainda publica as capturas de tela determinísticas
da linha de base/candidata e registra que a testemunha conectada foi
ignorada.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Concede ou reutiliza um desktop Crabbox, sincroniza o checkout com a VM, executa
`pnpm openclaw qa slack` nela, abre o Slack Web no navegador VNC,
captura o desktop e copia tanto os artefatos de QA do Slack (`slack-qa/`) quanto
a captura de tela/o vídeo do VNC de volta para o ambiente local. Este é o único formato do Mantis em que o
Gateway do SUT e o navegador são executados na mesma VM.

Com `--gateway-setup`, o comando cria um diretório inicial persistente e descartável do OpenClaw
em `$HOME/.openclaw-mantis/slack-openclaw` na VM, ajusta a configuração do Socket Mode do Slack
para o canal de destino, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` e mantém o
Chrome em execução na sessão VNC; omitir `--gateway-setup` executa o fluxo normal
de QA bot a bot do Slack.

Variáveis de ambiente obrigatórias para `--credential-source env` (o padrão local é `env`; o padrão da
função é `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para o fluxo de modelo remoto (se apenas `OPENAI_API_KEY`
  estiver definido localmente, o Mantis o copiará para `OPENCLAW_LIVE_OPENAI_KEY` antes de
  invocar o Crabbox)

Com `--credential-source convex`, o Mantis obtém temporariamente a credencial do SUT do Slack
do pool compartilhado antes de criar a VM e encaminha o ID do canal, o token do aplicativo e
o token do bot para a VM como variáveis de ambiente `OPENCLAW_MANTIS_SLACK_*`, de modo que os fluxos de trabalho do GitHub
precisem apenas do segredo do broker Convex, não dos tokens brutos do Slack.

Outras opções: `--slack-url <url>` abre uma URL específica (caso contrário, o Mantis deriva
`https://app.slack.com/client/<team>/<channel>` de `auth.test`);
`--slack-channel-id <id>` define o canal da lista de permissões do Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome
dentro da VM (padrão `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` executa os cenários nativos de aprovação do Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) e renderiza
capturas de tela de checkpoints pendentes/resolvidos em vez da configuração do Gateway (mutuamente
exclusivo com `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados ao
fluxo em tempo real do Slack.

As capturas de tela dos checkpoints de aprovação são renderizadas a partir da mensagem da API do Slack
observada pelo cenário, não da interface em tempo real do Slack; `slack-desktop-smoke.png` serve apenas como
prova do próprio Slack Web quando o perfil do navegador da concessão já estava
conectado.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Concede ou reutiliza um desktop Crabbox, instala o Telegram Desktop nativo para Linux,
opcionalmente restaura um arquivo de sessão de usuário, configura o OpenClaw com o
token de bot do SUT do Telegram obtido temporariamente, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publica uma
mensagem de prontidão do bot de driver no grupo privado concedido e, em seguida, captura uma
tela e um MP4. Um token de bot apenas configura o OpenClaw; ele nunca conecta
o Telegram Desktop. O visualizador do desktop é uma sessão separada de usuário do Telegram,
restaurada de `--telegram-profile-archive-env <name>` ou conectada manualmente
por VNC e mantida ativa com `--keep-lease`.

Opções: `--lease-id <cbx_...>` executa novamente em uma VM já conectada ao
Telegram Desktop; `--telegram-profile-archive-env <name>` restaura um arquivo de perfil
`.tgz` em base64 antes da inicialização; `--telegram-profile-dir <remote-path>`
define o diretório remoto do perfil (padrão `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` apenas instala e abre o Telegram Desktop;
`--credential-source`/`--credential-role` usam `convex`/`maintainer` por padrão.

## Manifesto de evidências

Todo cenário que publica em uma PR grava `mantis-evidence.json` ao lado
do respectivo relatório:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA das reações de status do Discord no Mantis",
  "summary": "Resumo principal legível por humanos para o comentário da PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Linha de base somente em fila",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Linha do tempo de referência do Discord",
      "width": 420
    }
  ]
}
```

O `path` do artefato é relativo ao diretório do manifesto; o `targetPath` é
relativo ao prefixo configurado de artefatos do R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
rejeita a travessia de caminhos e ignora entradas com `"required": false` quando o
arquivo está ausente.

Tipos de artefato: `timeline` (captura de tela determinística de antes/depois),
`desktopScreenshot` (captura de tela de VNC/navegador), `motionPreview` (GIF animado
incorporado da gravação), `motionClip` (MP4 recortado por movimento), `fullVideo` (gravação
completa), `metadata` (arquivo auxiliar JSON/log), `report` (relatório em Markdown).

Layout dos artefatos de uma execução no disco:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Capturas de tela são evidências, não segredos, mas ainda exigem disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Defina
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos; essa opção fica
ativada por padrão nos workflows do GitHub para Discord/Slack/Telegram.

## Automação do GitHub

`scripts/mantis/publish-pr-evidence.mjs` é o publicador reutilizável. Os workflows
o chamam com o manifesto, a PR de destino, a raiz de destino dos artefatos, o marcador do comentário,
a URL dos artefatos, a URL da execução e a origem da solicitação. Ele envia os artefatos declarados ao
bucket R2 do Mantis, cria um comentário de PR com o resumo primeiro, incluindo
imagens/prévias incorporadas e vídeos vinculados, e então atualiza o comentário de marcador existente ou
cria um novo. Variáveis de ambiente obrigatórias:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (os workflows definem `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (os workflows definem `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (os workflows definem `https://artifacts.openclaw.ai`)

Os comentários são publicados pelo GitHub App do Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), não por `github-actions[bot]`, usando um
comentário de marcador oculto como chave de upsert.

| Workflow                          | Gatilho                                                                                    | O que faz                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | acionamento manual                                                                            | Executa `discord-smoke` em uma ref escolhida.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | comentário em PR ou acionamento manual                                                              | Cria worktrees separados para a linha de base e o candidato, executa `discord-status-reactions-tool-only` em cada um, renderiza a linha do tempo de cada faixa em um navegador desktop do Crabbox, gera prévias em GIF/MP4 recortadas por movimento com `crabbox media preview`, envia os artefatos e publica evidências incorporadas na PR.                                 |
| `Mantis Scenario`                 | acionamento manual                                                                            | Despachante genérico: recebe `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` e encaminha para o workflow do cenário correspondente. |
| `Mantis Slack Desktop Smoke`      | acionamento manual                                                                            | Aloca um desktop Linux do Crabbox (o padrão é `aws`, com opção de `hetzner`), executa `slack-desktop-smoke --gateway-setup` no candidato, grava o desktop, gera uma prévia de movimento, envia os artefatos e publica evidências na PR quando um número de PR é fornecido.                                                      |
| `Mantis Telegram Live`            | comentário em PR ou acionamento manual                                                              | Executa a faixa de QA ao vivo do Telegram pela API do bot (`openclaw qa telegram`), grava `mantis-evidence.json` a partir do resumo de QA, renderiza HTML de evidências com dados sensíveis ocultados em um navegador desktop do Crabbox, gera um GIF de movimento e publica evidências na PR. O login no Telegram Web não é necessário para essa faixa.                               |
| `Mantis Telegram Desktop Proof`   | rótulo de PR do mantenedor (`mantis: telegram-visible-proof`) mais comentário em PR, ou acionamento manual | Prova agêntica nativa de antes/depois no Telegram Desktop. Entrega a PR, as refs de linha de base/candidato e as instruções do mantenedor ao Codex, que executa a faixa de prova do Telegram Desktop do Crabbox com usuário real para ambas as refs e publica uma tabela de evidências de PR com 2 colunas.                                                              |
| `Mantis Web UI Chat Proof`        | comentário em PR ou acionamento manual                                                              | Executa no candidato a prova Playwright focada do chat da UI de Controle do OpenClaw, verifica se o navegador envia por meio do Gateway simulado, captura artefatos de captura de tela/vídeo e publica evidências na PR. Essa faixa comprova apenas o chat da Web, não o WinUI/aplicativo nativo nem provas visuais arbitrárias.                           |

`Mantis Discord Status Reactions` e `Mantis Telegram Live` aceitam
`baseline_ref`/`candidate_ref` (ou `baseline=`/`candidate=` em um comentário de PR)
e validam se o SHA resolvido é um ancestral de `origin/main`, uma
tag de versão (`v*`) ou o head de uma PR aberta antes da execução com
credenciais que contêm segredos.

Gatilhos por comentário, em uma PR com acesso de gravação/manutenção/administração:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Os gatilhos por comentário do Telegram usam por padrão o SHA do head da PR como candidato e
`telegram-status-command` como cenário; eles aceitam `provider=aws|hetzner` e
`lease=<cbx_...>` para selecionar um provedor específico do Crabbox ou um
desktop pré-aquecido. `Mantis Telegram Desktop Proof` somente responde a um comentário de PR quando
a PR já possui o rótulo `mantis: telegram-visible-proof`.

Os gatilhos por comentário do chat da UI Web usam por padrão o SHA do head da PR como candidato. Eles executam
a prova de chat da UI de Controle com Gateway simulado e publicam artefatos do navegador; use
provas normais de Playwright/navegador, capturas de tela do mantenedor, Crabbox ou artefatos
locais para outras páginas Web e superfícies de aplicativos nativos.

O ClawSweeper também pode acionar diretamente um cenário:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas e segredos

Os padrões locais da CLI do Crabbox são `--provider hetzner --class beast`; substitua-os
com `--provider`, `--class`/`--machine-class` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Os workflows do GitHub
geralmente substituem ambos (por exemplo, `--class standard` e a entrada de escolha do provedor
`aws`/`hetzner` do workflow do Slack). Se um provedor estiver
lento demais ou indisponível, adicione-o por trás da mesma interface do Crabbox em vez de
codificar um fallback diretamente.

Linha de base da VM: Linux com Chrome/Chromium compatível com desktop, acesso por CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ ou 25.9+ e pnpm, um checkout do OpenClaw e
acesso de saída ao transporte de destino, GitHub, provedores de modelo e ao
agente de credenciais.

Nomes de credenciais e variáveis de ambiente usados nos comandos e workflows do Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- O `qa mantis run --credential-source env` local também exige
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Os workflows do GitHub normalmente usam
  `--credential-source convex` e as credenciais do agente abaixo em vez de tokens
  brutos do bot do Discord.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (ou o `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY` específico
  da prova do Telegram Desktop)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (os workflows também aceitam
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` como fallback e os mapeiam
  para os nomes simples antes de invocar o Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

O executor do Mantis nunca deve imprimir tokens de bots do Discord/Slack/Telegram,
chaves de API de provedores, cookies do navegador, conteúdo de perfis de autenticação, senhas de VNC nem
payloads brutos de credenciais. Se um token vazar em uma issue, PR, chat ou log,
faça sua rotação depois que o segredo substituto for armazenado.

## Resultados da execução

Os cenários de transporte de antes/depois distinguem estes resultados para que um ambiente
instável não seja interpretado como uma regressão do produto:

- **Bug reproduzido**: a linha de base falhou da maneira esperada pelo cenário.
- **Falha do harness**: a configuração do ambiente, as credenciais, a API do transporte, o navegador
  ou o provedor falharam antes que o oráculo produzisse um resultado significativo.

A prova de navegador somente do candidato informa se o candidato passou pelo Gateway
simulado e pelas asserções visíveis da UI; ela não alega ter reproduzido a linha de base.

## Como adicionar um cenário

Os cenários de transporte ao vivo são definidos em TypeScript por transporte (consulte
`MANTIS_SCENARIO_CONFIGS` em `extensions/qa-lab/src/mantis/run.runtime.ts` para ver
o formato de antes/depois do Discord), e não em um formato de arquivo declarativo independente.
Cada cenário precisa de: id e título, transporte, credenciais obrigatórias, política da ref de
linha de base, política da ref do candidato, patch de configuração do OpenClaw, etapas de configuração/estímulo,
oráculo esperado para a linha de base e o candidato, alvos de captura visual, orçamento de
tempo limite e etapas de limpeza.

A prova de navegador focada somente no candidato pode usar um teste E2E determinístico
e um workflow dedicados. Mantenha seu escopo explícito, valide a ref do candidato antes
da execução, isole a publicação baseada em segredos e emita o mesmo contrato de
manifesto de evidências.

Prefira oráculos pequenos e tipados a verificações visuais: estado das reações ou
referências de mensagens do Discord, estado de `ts`/reação da API de threads do Slack, ids
e cabeçalhos de mensagens de e-mail. Use capturas de tela do navegador quando a UI for o único elemento observável
confiável e mantenha as verificações visuais como complemento a um oráculo da API da plataforma, quando houver.

Depois do Discord, Slack e Telegram, o mesmo formato de executor pode ser estendido ao WhatsApp
(login por QR, reidentificação, entrega, mídia, reações) e ao Matrix
(salas criptografadas, relações de thread/resposta, retomada após reinicialização); nenhum dos dois está
implementado ainda.

## Questões em aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o bot
  Mantis existente for reutilizado?
- Por quanto tempo o GitHub deve reter os artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente um cenário do Mantis em vez de
  aguardar um comando de um mantenedor?
- As capturas de tela devem ser ocultadas ou recortadas antes do envio para PRs públicos?
