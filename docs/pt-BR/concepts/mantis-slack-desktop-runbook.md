---
read_when:
    - Executando o QA de desktop do Mantis Slack a partir do GitHub ou localmente
    - Depuração de execuções lentas do Mantis Slack no desktop
    - Escolhendo o modo de fonte, pré-hidratado ou concessão aquecida
    - Publicando evidências de captura de tela e vídeo em um PR
summary: 'Runbook do operador para QA do Mantis Slack desktop: dispatch do GitHub, CLI local, concessões VNC aquecidas, modos de hidratação, interpretação de tempos, artefatos e tratamento de falhas.'
title: Manual de operações do Mantis Slack para desktop
x-i18n:
    generated_at: "2026-05-06T05:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

QA de desktop Slack do Mantis é a lane de interface real para bugs da classe Slack que precisam de um
desktop Linux, resgate por VNC, Slack Web, um Gateway OpenClaw real, capturas de tela,
vídeos e um comentário de evidência no PR.

Use-a quando testes unitários ou a lane live sem interface do Slack não conseguirem comprovar o bug.

## Modelo de armazenamento

O Mantis usa três camadas de armazenamento diferentes:

- Imagem do provedor: de propriedade do Crabbox e armazenada na conta do provedor de nuvem.
  Ela contém capacidades da máquina, como Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, ferramentas nativas de build e diretórios de cache vazios.
- Estado de lease aquecido: de propriedade da sessão atual do operador. Ele pode conter um
  perfil de navegador autenticado, `/var/cache/crabbox/pnpm` e um checkout de origem
  preparado enquanto o lease estiver ativo.
- Artefatos do Mantis: de propriedade da execução do OpenClaw. Eles ficam em
  `.artifacts/qa-e2e/mantis/...`, depois o GitHub Actions faz upload deles e o
  GitHub App do Mantis comenta evidências inline no PR.

Nunca coloque segredos, cookies do navegador, estado de login do Slack, checkouts de repositório,
`node_modules` ou `dist/` em uma imagem de provedor pré-preparada.

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

Os valores permitidos de `candidate_ref` são intencionalmente restritos porque o workflow
usa credenciais live: ancestralidade atual de `main`, tags de release ou o head de um PR aberto
de `openclaw/openclaw`.

O workflow grava:

- artefato enviado: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- comentário inline no PR pelo GitHub App do Mantis;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- logs remotos como `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` e `ffmpeg.log`.

O comentário do PR é atualizado no mesmo local pelo marcador oculto
`<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Prova fria a partir da origem:

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

Reutilize um lease aquecido:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Use `--hydrate-mode prehydrated` somente quando o workspace remoto reutilizado já
tiver `node_modules` e um `dist/` criado. O Mantis falha fechado se eles estiverem
ausentes.

## Modos de hidratação

| Modo          | Use quando                                  | Comportamento remoto                                                                       | Tradeoff                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Prova normal de PR, máquinas frias, CI        | Executa `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` dentro da VM | Mais lento, prova mais forte de checkout de origem                 |
| `prehydrated` | Você preparou intencionalmente um lease reutilizado | Exige `node_modules` e `dist/` existentes; pula install/build                     | Rápido, mas válido apenas para leases aquecidos controlados pelo operador |

O GitHub Actions sempre prepara o checkout candidato antes da execução na VM. O
store do pnpm é armazenado em cache por sistema operacional, versão do Node e lockfile. A execução de origem na VM também
usa `/var/cache/crabbox/pnpm` quando presente.

## Interpretação de tempo

`mantis-slack-desktop-smoke-report.md` inclui tempos por fase:

- `crabbox.warmup`: boot do provedor de nuvem, prontidão do desktop/navegador e SSH.
- `crabbox.inspect`: consulta de metadados do lease.
- `credentials.prepare`: aquisição de lease de credenciais do Convex.
- `crabbox.remote_run`: sync, inicialização do navegador, instalação/build do OpenClaw ou
  validação de hidratação, inicialização do Gateway, captura de tela e captura de vídeo.
- `artifacts.copy`: rsync de volta a partir da VM.

`crabbox.remote_run` pode ser marcado como `accepted` quando o Crabbox retorna um status
remoto diferente de zero depois que o Mantis copiou metadados comprovando que o Gateway OpenClaw
está ativo e que a configuração foi concluída. Trate `accepted` como aprovação com explicação,
não como um cenário com falha.

Se a execução estiver lenta:

- warmup domina: pré-prepare ou promova uma imagem de provedor Crabbox melhor;
- remote_run domina em `source`: use um lease aquecido, melhore a reutilização do store do pnpm
  ou mova pré-requisitos da máquina para a imagem do provedor;
- remote_run domina em `prehydrated`: o workspace remoto não estava realmente
  pronto, ou a configuração do Gateway/navegador/Slack está lenta;
- cópia de artefatos domina: inspecione o tamanho do vídeo e o conteúdo do diretório de artefatos.

## Checklist de evidências

Um bom comentário de PR deve mostrar:

- id do cenário e SHA candidato;
- URL da execução do GitHub Actions;
- URL do artefato;
- captura de tela inline;
- prévia animada inline quando disponível;
- links para o MP4 completo e o MP4 recortado;
- status de aprovação/falha;
- resumo de tempos no relatório anexado.

Não faça commit de capturas de tela ou vídeos no repositório. Mantenha-os em artefatos do GitHub
Actions ou no comentário do PR.

## Tratamento de falhas

Se o workflow falhar antes da execução na VM, inspecione primeiro o job do Actions. Causas
típicas são `candidate_ref` não confiável, segredos de ambiente ausentes ou falha de
install/build do candidato.

Se a execução na VM falhar, mas as capturas de tela tiverem sido copiadas de volta, inspecione:

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
`--lease-id`. Não incorpore esse perfil de navegador em uma imagem de provedor.

## Relacionados

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation)
- [Canal Slack](/pt-BR/channels/slack)
- [Testes](/pt-BR/help/testing)
