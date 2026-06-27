---
read_when:
    - Executando a QA do Mantis Slack desktop a partir do GitHub ou localmente
    - Depurando execuções lentas do Mantis no desktop do Slack
    - Escolhendo o modo de origem, pré-hidratado ou warm-lease
    - Publicando evidências de captura de tela e vídeo em um PR
summary: 'Manual operacional para QA do desktop Slack do Mantis: dispatch do GitHub, CLI local, leases VNC aquecidas, modos de hidratação, interpretação de tempos, artefatos e tratamento de falhas.'
title: Runbook do Mantis Slack desktop
x-i18n:
    generated_at: "2026-06-27T17:24:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

O QA de desktop do Mantis Slack é a trilha de UI real para bugs da classe Slack que precisam de um
desktop Linux, resgate por VNC, Slack Web, um Gateway OpenClaw real, capturas de tela,
vídeos e um comentário de evidência no PR.

Use-o quando testes unitários ou a trilha live headless do Slack não conseguirem provar o bug.

## Modelo de armazenamento

O Mantis usa três camadas de armazenamento diferentes:

- Imagem do provedor: pertencente ao Crabbox e armazenada na conta do provedor de nuvem.
  Ela contém capacidades da máquina, como Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, ferramentas nativas de build e diretórios de cache vazios.
- Estado de lease quente: pertencente à sessão atual do operador. Ele pode conter um
  perfil de navegador autenticado, `/var/cache/crabbox/pnpm` e um checkout de código-fonte
  preparado enquanto o lease estiver ativo.
- Artefatos do Mantis: pertencentes à execução do OpenClaw. Eles ficam em
  `.artifacts/qa-e2e/mantis/...`; depois, o GitHub Actions os envia e o
  Mantis GitHub App comenta evidências inline no PR.

Nunca coloque segredos, cookies de navegador, estado de login do Slack, checkouts de repositório,
`node_modules` ou `dist/` em uma imagem prebaked do provedor.

## Dispatch do GitHub

Execute o workflow a partir de `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

Os valores permitidos para `candidate_ref` são intencionalmente restritos porque o workflow
usa credenciais live: ancestralidade da `main` atual, tags de release ou o head de um PR aberto
de `openclaw/openclaw`.

O workflow grava:

- artefato enviado: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- comentário inline no PR feito pelo Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- logs remotos como `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` e `ffmpeg.log`.

O comentário do PR é atualizado no mesmo lugar pelo marcador oculto
`<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Prova fria por código-fonte:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Mantenha a VM para resgate por VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Abra o VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Reutilize um lease quente:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Use `--hydrate-mode prehydrated` somente quando o workspace remoto reutilizado já
tiver `node_modules` e um `dist/` buildado. O Mantis falha fechado se eles estiverem
ausentes.

Prove a UI nativa de aprovação do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

O modo de checkpoint de aprovação é mutuamente exclusivo com `--gateway-setup`. Ele executa
os cenários opt-in `slack-approval-exec-native` e `slack-approval-plugin-native`,
a menos que você passe flags `--scenario` explícitas para checkpoint de aprovação; outros
cenários do Slack são rejeitados antes que a VM inicie. O executor de QA do Slack grava
cada arquivo JSON de checkpoint a partir da mensagem real da API do Slack que observou; depois, o
watcher remoto renderiza esse snapshot de mensagem em
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`. A execução falha se qualquer
JSON de checkpoint, evidência de mensagem, JSON de ack ou captura de tela renderizada estiver ausente ou vazio.

Leases frios do GitHub Actions não têm cookies do Slack Web, então a captura do navegador
pode cair no login do Slack. Para prova de checkpoint de aprovação, confie nas
imagens renderizadas de checkpoint e nos artefatos de QA do Slack em vez de
`slack-desktop-smoke.png`. Use um lease quente mantido com um perfil do Slack Web autenticado
manualmente somente quando a captura de tela do navegador em si precisar mostrar o Slack Web.

## Modos de hidratação

| Modo          | Use quando                                | Comportamento remoto                                                                  | Tradeoff                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Prova normal de PR, máquinas frias, CI    | Executa `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` dentro da VM | Mais lento, prova mais forte de checkout de código-fonte |
| `prehydrated` | Você preparou intencionalmente um lease reutilizado | Exige `node_modules` e `dist/` existentes; pula install/build                         | Rápido, mas válido apenas para leases quentes controlados pelo operador |

O GitHub Actions sempre prepara o checkout candidato antes da execução da VM. Seu
armazenamento pnpm é colocado em cache por SO, versão do Node e lockfile. A execução por código-fonte na VM também
usa `/var/cache/crabbox/pnpm` quando presente.

## Interpretação de timing

`mantis-slack-desktop-smoke-report.md` inclui timings por fase:

- `crabbox.warmup`: boot do provedor de nuvem, prontidão do desktop/navegador e SSH.
- `crabbox.inspect`: busca de metadados do lease.
- `credentials.prepare`: aquisição de lease de credencial do Convex.
- `crabbox.remote_run`: sync, inicialização do navegador, install/build do OpenClaw ou
  validação de hidratação, inicialização do Gateway, captura de tela e captura de vídeo.
- `artifacts.copy`: rsync de volta da VM.

`crabbox.remote_run` pode ser marcado como `accepted` quando o Crabbox retorna um status remoto
diferente de zero depois que o Mantis copiou metadados provando que a configuração do Gateway
OpenClaw foi concluída ou que o próprio comando de QA do Slack saiu com sucesso.
Trate `accepted` como aprovado-com-explicação, não como um cenário com falha.

Se a execução estiver lenta:

- warmup domina: faça prebake ou promova uma imagem de provedor Crabbox melhor;
- remote_run domina em `source`: use um lease quente, melhore a reutilização do armazenamento pnpm
  ou mova pré-requisitos da máquina para a imagem do provedor;
- remote_run domina em `prehydrated`: o workspace remoto não estava realmente
  pronto, ou a configuração do Gateway/navegador/Slack está lenta;
- cópia de artefatos domina: inspecione o tamanho do vídeo e o conteúdo do diretório de artefatos.

## Checklist de evidências

Um bom comentário de PR deve mostrar:

- id do cenário e SHA candidato;
- URL da execução do GitHub Actions;
- URL do artefato;
- captura de tela inline de checkpoint de aprovação ou uma captura de tela do Slack Web de um
  lease quente autenticado;
- prévia animada inline quando disponível;
- links para o MP4 completo e o MP4 recortado;
- status de aprovação/falha;
- resumo de timing no relatório anexado.

Não faça commit de capturas de tela ou vídeos no repositório. Mantenha-os nos artefatos do
GitHub Actions ou no comentário do PR.

## Tratamento de falhas

Se o workflow falhar antes da execução da VM, inspecione primeiro o job do Actions. Causas
típicas são `candidate_ref` não confiável, segredos de ambiente ausentes ou falha de install/build
do candidato.

Se a execução da VM falhar, mas as capturas de tela tiverem sido copiadas de volta, inspecione:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Se a execução manteve o lease, abra o VNC com o comando `crabbox vnc ...` do relatório.
Pare o lease quando terminar:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Se o login do Slack expirou, repare-o no VNC em um lease mantido e execute novamente com
`--lease-id`. Não inclua esse perfil de navegador em uma imagem de provedor.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation)
- [Canal Slack](/pt-BR/channels/slack)
- [Testes](/pt-BR/help/testing)
