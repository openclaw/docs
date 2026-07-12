---
read_when:
    - Procurando o status do aplicativo complementar para Linux
    - Planejamento da cobertura de plataformas ou de contribuições
    - Depuração de encerramentos por OOM no Linux ou código de saída 137 em uma VPS ou contêiner
summary: Suporte ao Linux + status do aplicativo complementar
title: Aplicativo para Linux
x-i18n:
    generated_at: "2026-07-12T00:03:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

O Gateway é totalmente compatível com Linux. Node é o runtime recomendado; Bun
não é recomendado (devido a problemas conhecidos com WhatsApp/Telegram).

Ainda não há um aplicativo complementar nativo para Linux. Contribuições são bem-vindas.

## Caminho rápido (VPS)

1. Instale o Node 24 (recomendado) ou o Node 22.19+ (LTS, ainda compatível).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. No seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e autentique-se com o segredo compartilhado
   configurado (token por padrão; senha se `gateway.auth.mode` for `"password"`).

Guia completo do servidor: [Servidor Linux](/pt-BR/vps). Exemplo de VPS passo a passo:
[exe.dev](/pt-BR/install/exe-dev).

## Instalação

- [Primeiros passos](/pt-BR/start/getting-started)
- [Instalação e atualizações](/pt-BR/install/updating)
- Opcional: [Bun (experimental)](/pt-BR/install/bun), [Nix](/pt-BR/install/nix), [Docker](/pt-BR/install/docker)

## Serviço do Gateway (systemd)

Instale com um destes comandos:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # selecione "Serviço do Gateway" quando solicitado
```

Repare ou migre uma instalação existente:

```bash
openclaw doctor
```

Por padrão, `openclaw gateway install` gera uma unidade de **usuário** do systemd. As
orientações completas sobre o serviço, incluindo a variante de unidade em nível de
**sistema** para hosts compartilhados ou sempre ativos, estão no [guia operacional do Gateway](/pt-BR/gateway#supervision-and-service-lifecycle).

Crie uma unidade manualmente apenas para uma configuração personalizada. Exemplo mínimo
de unidade de usuário (`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Ative-a:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressão de memória e encerramentos por OOM

No Linux, o kernel escolhe uma vítima de OOM quando um host, uma VM ou o cgroup
de um contêiner fica sem memória. O Gateway é uma vítima inadequada porque gerencia
sessões de longa duração e conexões de canais; por isso, o OpenClaw prioriza o
encerramento de processos filhos transitórios sempre que possível.

Para inicializações elegíveis de processos filhos no Linux, o OpenClaw envolve o comando
em um pequeno adaptador `/bin/sh` que eleva o `oom_score_adj` do próprio processo filho
para `1000` e então executa o comando real com `exec`. Isso não exige privilégios: um
processo sempre pode aumentar sua própria pontuação de OOM.

Superfícies de processos filhos abrangidas:

- Processos filhos de comandos gerenciados pelo supervisor
- Processos filhos de shell PTY
- Processos filhos de servidores MCP via stdio
- Processos de navegador/Chrome iniciados pelo OpenClaw (por meio do runtime de processos do SDK de plugins)

O adaptador é exclusivo do Linux e é ignorado quando `/bin/sh` não está disponível ou quando
o ambiente do processo filho define `OPENCLAW_CHILD_OOM_SCORE_ADJ` como `0`, `false`, `no` ou
`off`.

Verifique um processo filho:

```bash
cat /proc/<child-pid>/oom_score_adj
```

O valor esperado para os processos filhos abrangidos é `1000`; o próprio processo do Gateway
mantém sua pontuação normal (geralmente `0`).

A opção `OOMPolicy=continue` da unidade systemd mantém o serviço do Gateway ativo quando
um processo filho transitório é selecionado pelo encerrador de OOM, em vez de marcar toda a
unidade como falha e reiniciar todos os canais; o processo filho ou a sessão que falhou relata
seu próprio erro.

Isso não substitui o ajuste normal de memória. Se uma VPS ou um contêiner encerrar processos
filhos repetidamente, aumente o limite de memória, reduza a simultaneidade ou adicione controles
de recursos mais rigorosos (`MemoryMax=` do systemd, limites de memória do contêiner).

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Raspberry Pi](/pt-BR/install/raspberry-pi)
- [Guia operacional do Gateway](/pt-BR/gateway)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
