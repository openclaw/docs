---
read_when:
    - Buscando status do aplicativo complementar para Linux
    - Planejamento da cobertura da plataforma ou contribuições
    - Depuração de encerramentos por falta de memória (OOM) no Linux ou saída 137 em um VPS ou contêiner
summary: Suporte a Linux + status do aplicativo complementar
title: Aplicativo Linux
x-i18n:
    generated_at: "2026-05-07T13:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

O Gateway é totalmente compatível com Linux. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs no WhatsApp/Telegram).

Aplicativos complementares nativos para Linux estão planejados. Contribuições são bem-vindas se você quiser ajudar a criar um.

## Caminho rápido para iniciantes (VPS)

1. Instale o Node 24 (recomendado; Node 22 LTS, atualmente `22.16+`, ainda funciona por compatibilidade)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Do seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e autentique-se com o segredo compartilhado configurado (token por padrão; senha se você definir `gateway.auth.mode: "password"`)

Guia completo de servidor Linux: [Servidor Linux](/pt-BR/vps). Exemplo VPS passo a passo: [exe.dev](/pt-BR/install/exe-dev)

## Instalação

- [Primeiros passos](/pt-BR/start/getting-started)
- [Instalação e atualizações](/pt-BR/install/updating)
- Fluxos opcionais: [Bun (experimental)](/pt-BR/install/bun), [Nix](/pt-BR/install/nix), [Docker](/pt-BR/install/docker)

## Gateway

- [Runbook do Gateway](/pt-BR/gateway)
- [Configuração](/pt-BR/gateway/configuration)

## Instalação do serviço Gateway (CLI)

Use uma destas opções:

```
openclaw onboard --install-daemon
```

Ou:

```
openclaw gateway install
```

Ou:

```
openclaw configure
```

Selecione **Serviço Gateway** quando solicitado.

Reparar/migrar:

```
openclaw doctor
```

## Controle do sistema (unidade de usuário systemd)

O OpenClaw instala um serviço **de usuário** systemd por padrão. Use um serviço **de sistema**
para servidores compartilhados ou sempre ativos. `openclaw gateway install` e
`openclaw onboard --install-daemon` já renderizam a unidade canônica atual
para você; escreva uma manualmente apenas quando precisar de uma configuração
personalizada de sistema/gerenciador de serviços. A orientação completa sobre serviços fica no [runbook do Gateway](/pt-BR/gateway).

Configuração mínima:

Crie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Habilite-o:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressão de memória e encerramentos por OOM

No Linux, o kernel escolhe uma vítima de OOM quando um host, VM ou cgroup de contêiner
fica sem memória. O Gateway pode ser uma vítima ruim porque mantém sessões
persistentes e conexões de canal. Por isso, o OpenClaw prioriza, quando possível,
que processos filhos transitórios sejam encerrados antes do Gateway.

Para criações de processos filhos Linux elegíveis, o OpenClaw inicia o filho por meio de um wrapper
curto em `/bin/sh` que aumenta o `oom_score_adj` do próprio filho para `1000` e então
executa o comando real com `exec`. Esta é uma operação sem privilégios porque o filho
está apenas aumentando sua própria probabilidade de encerramento por OOM.

As superfícies de processos filhos cobertas incluem:

- processos filhos de comandos gerenciados pelo supervisor,
- processos filhos de shell PTY,
- processos filhos de servidores stdio MCP,
- processos de navegador/Chrome iniciados pelo OpenClaw.

O wrapper é exclusivo do Linux e é ignorado quando `/bin/sh` não está disponível. Ele
também é ignorado se o env do filho definir `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Para verificar um processo filho:

```bash
cat /proc/<child-pid>/oom_score_adj
```

O valor esperado para filhos cobertos é `1000`. O processo Gateway deve manter
sua pontuação normal, geralmente `0`.

Isso não substitui o ajuste normal de memória. Se uma VPS ou contêiner encerrar filhos repetidamente,
aumente o limite de memória, reduza a concorrência ou adicione controles de recursos mais fortes,
como `MemoryMax=` do systemd ou limites de memória no nível do contêiner.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Raspberry Pi](/pt-BR/install/raspberry-pi)
