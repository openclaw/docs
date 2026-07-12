---
read_when:
    - Criar ou executar testes visuais de QA em ambiente real para bugs do OpenClaw
    - Adicionando verificação antes e depois para uma solicitação de pull request
    - Adição de cenários de transporte em tempo real para Discord, Slack, WhatsApp ou outros serviços
    - Executando uma verificação direcionada no navegador da interface de controle para uma referência candidata
    - Depuração de execuções de QA que exigem capturas de tela, automação do navegador ou acesso VNC
summary: O Mantis captura evidências visuais de ponta a ponta para comparações de transporte ao vivo e provas focadas no navegador apenas para candidatos, e depois anexa os artefatos aos PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-07-11T23:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

O Mantis publica evidências visuais de CI e um comentário no PR sobre o comportamento do OpenClaw.
Os cenários de transporte ao vivo comparam uma linha de base sabidamente problemática com uma ref candidata;
fluxos focados de navegador podem, em vez disso, validar uma candidata em relação a um transporte simulado
determinístico. O Discord foi disponibilizado primeiro, com autenticação real de bot, canais de servidor,
reações, threads e uma testemunha no navegador. Também existem fluxos para Slack, Telegram e chats focados da
interface de controle; WhatsApp e Matrix ainda não foram implementados.

## Responsabilidades

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime dos cenários, CLI `pnpm openclaw qa mantis <command>`, esquema de evidências.
- Laboratório de QA (`extensions/qa-lab/src/live-transports/*`): infraestrutura de transporte ao vivo, bots de driver/SUT, geradores de relatórios/evidências.
- Crabbox (`openclaw/crabbox`): máquinas Linux pré-aquecidas, concessões, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): pontos de entrada remotos, retenção de artefatos.
- ClawSweeper: interpreta comandos de mantenedores em PRs, dispara fluxos de trabalho e publica o comentário final no PR.

## Comandos da CLI

Todos os comandos seguem o formato `pnpm openclaw qa mantis <command>`, definido em
`extensions/qa-lab/src/mantis/cli.ts`. Requer `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante a compilação/execução (os fluxos de trabalho incluídos definem `OPENCLAW_BUILD_PRIVATE_QA=1` e
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes da compilação).

| Comando                         | Finalidade                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discord-smoke`                 | Verificar se o bot do Mantis para Discord consegue ver o servidor/canal, publicar uma mensagem e reagir.                                                    |
| `run`                           | Executar um cenário de antes/depois comparando referências de linha de base e candidata (somente Discord).                                                  |
| `desktop-browser-smoke`         | Conceder/reutilizar um desktop Crabbox, abrir um navegador visível e capturar uma imagem + vídeo.                                                            |
| `slack-desktop-smoke`           | Conceder/reutilizar um desktop Crabbox, executar o QA do Slack nele, abrir o Slack Web e capturar evidências.                                                |
| `telegram-desktop-builder`      | Conceder/reutilizar um desktop Crabbox, instalar o Telegram Desktop e, opcionalmente, configurar um Gateway do OpenClaw.                                     |
| `visual-task` / `visual-driver` | Captura genérica de desktop Crabbox com verificações opcionais de compreensão de imagens; `visual-driver` é a parte do driver iniciada por `crabbox record --while`. |

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
do bot, o servidor, os canais do servidor e o canal de destino, verifica se o
canal pertence ao servidor e, em seguida (a menos que `--skip-post` seja usado), publica uma mensagem e
adiciona uma reação `👀`. Grava `mantis-discord-smoke-summary.json` e
`mantis-discord-smoke-report.md`.

Ordem de resolução do token: valor de `--token-file`, depois `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(substitua com `--token-env`) e, por fim, um arquivo indicado por `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(substitua com `--token-file-env`). Os IDs do servidor/canal vêm de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (substitua com
`--guild-id` / `--channel-id`) e devem ser snowflakes do Discord com 17 a 20 dígitos. Defina
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para substituir IDs e nomes de
bot/servidor/canal/mensagem por `<redacted>` no resumo e no relatório publicados.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Atualmente, `--transport` aceita apenas `discord`. `--scenario` é um dos dois
IDs integrados, cada um com sua própria referência de linha de base padrão e seus rótulos esperados de antes/depois
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Cenário                                    | Linha de base padrão                       | Resultado esperado da linha de base      | Resultado esperado da candidata |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ------------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done`    |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | resposta na thread omite o anexo `filePath` | resposta na thread o inclui  |

O padrão de `--candidate` é `HEAD`. Outras opções: `--credential-source`
(padrão `convex`), `--credential-role` (padrão `ci`), `--provider-mode`
(padrão `live-frontier`), `--fast` (ativado por padrão), `--skip-install`, `--skip-build`.

O executor cria checkouts separados de `git worktree` para a linha de base e
a candidata em `<output-dir>/worktrees/`, executa `pnpm install`/`pnpm build` em
cada um (a menos que sejam ignorados) e, em seguida, executa
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
em cada worktree. Cada fluxo grava `discord-qa-reaction-timelines.json`
junto com um par `<scenario-id>-timeline.html`/`.png`; o executor copia essas
evidências de volta para `baseline/`/`candidate/`, grava `comparison.json`,
`mantis-report.md` e `mantis-evidence.json` no diretório de saída e
encerra com código diferente de zero se a comparação não for aprovada (linha de base `fail` e candidata
`pass`).

O segundo cenário do Discord (`discord-thread-reply-filepath-attachment`) publica
uma mensagem principal com o bot driver, cria uma thread real, chama a ação
`message.thread-reply` do SUT com um `filePath` local ao repositório e, em seguida, consulta
periodicamente a thread em busca da resposta e do nome do arquivo anexado. Ele espera um anexo
chamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Concede ou reutiliza um desktop Crabbox, inicia um navegador dentro da sessão VNC
apontando para `--browser-url` (padrão `https://openclaw.ai`) ou para um
`--html-file` renderizado, aguarda, captura uma imagem com `scrot`, opcionalmente grava um MP4 com
`ffmpeg` e sincroniza `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de volta para `--output-dir` usando rsync.

Opções:

- `--lease-id <cbx_...>` reutiliza um desktop pré-aquecido em vez de criar um novo.
- `--browser-profile-dir <remote-path>` reutiliza um diretório remoto de dados do usuário do Chrome para que um desktop persistente permaneça autenticado entre execuções (usado para um perfil de visualização de longa duração no Discord Web).
- `--browser-profile-archive-env <name>` restaura um arquivo de perfil `.tgz` do Chrome codificado em base64 a partir dessa variável de ambiente antes da inicialização (padrão `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); usado para testemunhas autenticadas, como o Discord Web.
- `--video-duration <seconds>` controla a duração da captura do MP4 (padrão de 10s).
- `--keep-lease` (ou `OPENCLAW_MANTIS_KEEP_VM=1`) mantém aberta para inspeção por VNC uma concessão criada nesta execução; por padrão, execuções com falha que criaram uma concessão também a mantêm aberta.

Para evidências do Discord Web, o Mantis usa uma conta dedicada de visualização, não um token
de bot. O oráculo REST do Discord (por meio de `qa discord`) continua sendo a fonte oficial; quando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também grava um
artefato de URL do Discord Web, e `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` mantém a
thread aberta por tempo suficiente para o navegador abri-la.

O fluxo de trabalho do GitHub prefere um perfil persistente de visualização por meio de
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (arquivos de perfil completos podem ultrapassar
o limite de tamanho de segredos do GitHub); para perfis pequenos/de inicialização, ele pode restaurar um
`.tgz` em base64 de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se
nenhuma das fontes estiver configurada, o fluxo de trabalho ainda publica as imagens determinísticas
da linha de base/candidata e registra que a testemunha autenticada foi
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
captura o desktop e copia localmente tanto os artefatos do QA do Slack (`slack-qa/`) quanto
a imagem/vídeo do VNC. Esse é o único formato do Mantis em que o
Gateway do SUT e o navegador são executados dentro da mesma VM.

Com `--gateway-setup`, o comando cria um diretório inicial descartável e persistente do OpenClaw
em `$HOME/.openclaw-mantis/slack-openclaw` na VM, ajusta a
configuração do Socket Mode do Slack para o canal de destino, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` e mantém
o Chrome em execução na sessão VNC; omitir `--gateway-setup` executa o fluxo normal
de QA bot a bot do Slack.

Variáveis de ambiente obrigatórias para `--credential-source env` (o padrão local é `env`; a função
padrão é `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para o fluxo remoto de modelo (se apenas `OPENAI_API_KEY`
  estiver definida localmente, o Mantis a copia para `OPENCLAW_LIVE_OPENAI_KEY` antes de
  invocar o Crabbox)

Com `--credential-source convex`, o Mantis concede a credencial do SUT do Slack a partir
do pool compartilhado antes de criar a VM e encaminha o ID do canal, o token do aplicativo e
o token do bot para a VM como variáveis de ambiente `OPENCLAW_MANTIS_SLACK_*`, de modo que os fluxos de trabalho
do GitHub precisem apenas do segredo do broker Convex, e não dos tokens brutos do Slack.

Outras opções: `--slack-url <url>` abre uma URL específica (caso contrário, o Mantis deriva
`https://app.slack.com/client/<team>/<channel>` de `auth.test`);
`--slack-channel-id <id>` define o canal da lista de permissões do Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome
dentro da VM (padrão `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` executa os cenários nativos de aprovação do Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) e renderiza
imagens dos pontos de verificação pendentes/resolvidos em vez da configuração do Gateway (mutuamente
exclusivo com `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados ao
fluxo ao vivo do Slack.

As imagens dos pontos de verificação de aprovação são renderizadas a partir da mensagem da API do Slack que
o cenário observou, e não da interface ao vivo do Slack; `slack-desktop-smoke.png` é apenas
uma evidência do próprio Slack Web quando o perfil do navegador da concessão já estava
autenticado.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Aluga ou reutiliza um desktop Crabbox, instala o Telegram Desktop nativo para Linux,
opcionalmente restaura um arquivo de sessão do usuário, configura o OpenClaw com o
token do bot Telegram SUT alugado, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publica uma
mensagem de prontidão do bot controlador no grupo privado alugado e, em seguida, captura uma
imagem da tela e um MP4. Um token de bot apenas configura o OpenClaw; ele nunca inicia
uma sessão no Telegram Desktop. O visualizador do desktop é uma sessão separada de usuário do Telegram,
restaurada por meio de `--telegram-profile-archive-env <name>` ou iniciada manualmente
via VNC e mantida ativa com `--keep-lease`.

Opções: `--lease-id <cbx_...>` executa novamente em uma VM que já tem uma sessão iniciada no
Telegram Desktop; `--telegram-profile-archive-env <name>` restaura um arquivo de perfil
`.tgz` em base64 antes da inicialização; `--telegram-profile-dir <remote-path>`
define o diretório remoto do perfil (padrão: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` apenas instala e abre o Telegram Desktop;
`--credential-source`/`--credential-role` usam `convex`/`maintainer` como padrão.

## Manifesto de evidências

Cada cenário publicado em uma PR grava `mantis-evidence.json` ao lado
do respectivo relatório:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
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
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

O `path` do artefato é relativo ao diretório do manifesto; `targetPath` é
relativo ao prefixo de artefatos R2/S3 configurado. `scripts/mantis/publish-pr-evidence.mjs`
rejeita travessia de caminho e ignora entradas com `"required": false` quando o
arquivo está ausente.

Tipos de artefato: `timeline` (captura de tela determinística de antes/depois),
`desktopScreenshot` (captura de tela do VNC/navegador), `motionPreview` (GIF animado
incorporado, gerado a partir da gravação), `motionClip` (MP4 recortado conforme o movimento), `fullVideo` (gravação
completa), `metadata` (arquivo auxiliar JSON/log) e `report` (relatório em Markdown).

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
nomes de canais privados, nomes de usuário ou conteúdo de mensagens podem aparecer. Defina
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para envios públicos de artefatos; essa opção é
ativada por padrão nos fluxos de trabalho do GitHub para Discord/Slack/Telegram.

## Automação do GitHub

`scripts/mantis/publish-pr-evidence.mjs` é o publicador reutilizável. Os fluxos de trabalho
o invocam com o manifesto, a PR de destino, a raiz de destino dos artefatos, o marcador do comentário,
a URL dos artefatos, a URL da execução e a origem da solicitação. Ele envia os artefatos declarados para
o bucket R2 do Mantis, cria um comentário de PR que apresenta primeiro o resumo, com
imagens/pré-visualizações incorporadas e vídeos vinculados, e então atualiza o comentário com o marcador existente ou
cria um novo. Variáveis de ambiente obrigatórias:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (os fluxos de trabalho definem `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (os fluxos de trabalho definem `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (os fluxos de trabalho definem `https://artifacts.openclaw.ai`)

Os comentários são publicados pelo aplicativo Mantis do GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), e não por `github-actions[bot]`, usando um comentário
de marcador oculto como chave de inserção ou atualização.

| Fluxo de trabalho                  | Acionador                                                                                  | O que faz                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | acionamento manual                                                                         | Executa `discord-smoke` em uma referência escolhida.                                                                                                                                                                                                                                                                                      |
| `Mantis Discord Status Reactions` | comentário em PR ou acionamento manual                                                     | Cria árvores de trabalho separadas para a referência de base e a candidata, executa `discord-status-reactions-tool-only` em cada uma, renderiza a linha do tempo de cada faixa em um navegador de desktop Crabbox, gera pré-visualizações GIF/MP4 recortadas conforme o movimento com `crabbox media preview`, envia os artefatos e publica evidências incorporadas na PR. |
| `Mantis Scenario`                 | acionamento manual                                                                         | Despachante genérico: recebe `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` e encaminha para o fluxo de trabalho do cenário correspondente. |
| `Mantis Slack Desktop Smoke`      | acionamento manual                                                                         | Aluga um desktop Linux Crabbox (usa `aws` por padrão, com opção de `hetzner`), executa `slack-desktop-smoke --gateway-setup` na candidata, grava o desktop, gera uma pré-visualização de movimento, envia os artefatos e publica evidências na PR quando um número de PR é fornecido.                                                               |
| `Mantis Telegram Live`            | comentário em PR ou acionamento manual                                                     | Executa a faixa de QA ao vivo do Telegram pela API de bot (`openclaw qa telegram`), grava `mantis-evidence.json` a partir do resumo de QA, renderiza o HTML de evidências com dados sensíveis removidos por meio de um navegador de desktop Crabbox, gera um GIF de movimento e publica evidências na PR. Não é necessário iniciar sessão no Telegram Web para essa faixa. |
| `Mantis Telegram Desktop Proof`   | rótulo de PR do mantenedor (`mantis: telegram-visible-proof`) mais comentário na PR, ou acionamento manual | Prova agêntica nativa de antes/depois no Telegram Desktop. Entrega a PR, as referências de base/candidata e as instruções do mantenedor ao Codex, que executa a faixa de prova do Telegram Desktop para usuário real no Crabbox em ambas as referências e publica uma tabela de evidências com duas colunas na PR. |
| `Mantis Web UI Chat Proof`        | comentário em PR ou acionamento manual                                                     | Executa a prova Playwright focada no chat da interface de controle do OpenClaw na candidata, verifica se o navegador envia dados pelo Gateway simulado, captura artefatos de imagem da tela/vídeo e publica evidências na PR. Essa faixa comprova somente o chat na web, não o WinUI/aplicativo nativo nem provas visuais arbitrárias. |

`Mantis Discord Status Reactions` e `Mantis Telegram Live` aceitam
`baseline_ref`/`candidate_ref` (ou `baseline=`/`candidate=` em um comentário de PR)
e validam, antes da execução com credenciais que contêm segredos, se o SHA resolvido é um
ancestral de `origin/main`, uma tag de versão (`v*`) ou a ponta de uma PR aberta.

Acionadores por comentário, a partir de uma PR com acesso de gravação/manutenção/administração:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Os acionadores por comentário do Telegram usam por padrão o SHA da ponta da PR como candidato e
`telegram-status-command` como cenário; eles aceitam `provider=aws|hetzner` e
`lease=<cbx_...>` para direcionar a execução a um provedor Crabbox específico ou a um desktop
pré-aquecido. `Mantis Telegram Desktop Proof` só responde a um comentário de PR quando
a PR já possui o rótulo `mantis: telegram-visible-proof`.

Os acionadores por comentário do chat da interface web usam por padrão o SHA da ponta da PR como candidato. Eles executam
a prova de chat da interface de controle com Gateway simulado e publicam artefatos do navegador; use
a prova normal do Playwright/navegador, capturas de tela do mantenedor, Crabbox ou artefatos
locais para outras páginas web e superfícies de aplicativos nativos.

O ClawSweeper também pode despachar um cenário diretamente:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas e segredos

Os padrões locais da CLI do Crabbox são `--provider hetzner --class beast`; substitua-os
com `--provider`, `--class`/`--machine-class` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Os fluxos de trabalho
do GitHub normalmente substituem ambos (por exemplo, `--class standard` e a entrada de seleção
de provedor `aws`/`hetzner` do fluxo de trabalho do Slack). Se um provedor estiver muito
lento ou indisponível, adicione-o por trás da mesma interface do Crabbox, em vez de
codificar diretamente uma alternativa.

Configuração de base da VM: Linux com Chrome/Chromium compatível com desktop, acesso CDP, VNC/
noVNC, Node 22+ e pnpm, um checkout do OpenClaw e acesso de saída para o
transporte de destino, GitHub, provedores de modelos e o intermediador de credenciais.

Nomes de segredos usados nos fluxos de trabalho do Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para envios públicos de artefatos
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (os fluxos de trabalho também aceitam
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` como alternativa e os mapeiam
  para os nomes simples antes de invocar o Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

O executor do Mantis nunca deve imprimir tokens de bot do Discord/Slack/Telegram,
chaves de API de provedores, cookies do navegador, conteúdo de perfis de autenticação, senhas de VNC nem
cargas brutas de credenciais. Se um token vazar em uma issue, PR, conversa ou log,
rotacione-o depois que o segredo substituto for armazenado.

## Resultados das execuções

Os cenários de antes/depois do transporte distinguem estes resultados para que um ambiente
instável não seja interpretado como regressão do produto:

- **Bug reproduzido**: a referência de base falhou da maneira esperada pelo cenário.
- **Falha do ambiente de testes**: a configuração do ambiente, as credenciais, a API do transporte, o navegador
  ou o provedor falharam antes que o oráculo pudesse produzir um resultado significativo.

A prova somente da candidata no navegador informa se ela passou nas asserções do Gateway
simulado e da interface visível; ela não afirma que houve reprodução na referência de base.

## Adição de um cenário

Os cenários de transporte ao vivo são definidos em TypeScript por transporte (consulte
`MANTIS_SCENARIO_CONFIGS` em `extensions/qa-lab/src/mantis/run.runtime.ts` para
o formato de antes/depois do Discord), e não em um formato de arquivo declarativo independente.
Cada cenário precisa de: id e título, transporte, credenciais obrigatórias, política de referência
de base, política de referência candidata, patch de configuração do OpenClaw, etapas de configuração/estímulo,
oráculo esperado para a referência de base e a candidata, alvos de captura visual, orçamento de
tempo limite e etapas de limpeza.

A prova focada no navegador, somente para o candidato, pode usar um teste E2E determinístico dedicado
e um fluxo de trabalho. Mantenha seu escopo explícito, valide a referência do candidato antes da
execução, isole a publicação respaldada por segredos e emita o mesmo contrato de
manifesto de evidências.

Prefira oráculos pequenos e tipados em vez de verificações visuais: estado das reações ou
referências de mensagens do Discord, estado da API de reações/`ts` de threads do Slack, identificadores
e cabeçalhos de mensagens de e-mail. Use capturas de tela do navegador quando a interface for o único elemento observável confiável
e mantenha as verificações visuais como complemento a um oráculo da API da plataforma, quando houver.

Depois do Discord, Slack e Telegram, o mesmo formato de executor se estende ao WhatsApp
(login por QR, reidentificação, entrega, mídia e reações) e ao Matrix
(salas criptografadas, relações de thread/resposta e retomada após reinicialização); nenhum dos dois está
implementado ainda.

## Questões em aberto

- Qual bot do Discord deve ser o controlador e qual deve ser o SUT quando o bot Mantis
  existente for reutilizado?
- Por quanto tempo o GitHub deve reter os artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente um cenário do Mantis em vez de
  aguardar um comando de um mantenedor?
- As capturas de tela devem ser ocultadas ou recortadas antes do envio para PRs públicos?
