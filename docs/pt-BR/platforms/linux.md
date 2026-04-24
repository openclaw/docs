---
read_when:
    - Procurando o status do app complementar para Linux
    - Planejando cobertura de plataforma ou contribuições
    - Depurando encerramentos por OOM ou saída 137 no Linux em uma VPS ou contêiner
summary: Suporte a Linux + status do app complementar
title: App Linux
x-i18n:
    generated_at: "2026-04-24T06:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

O Gateway é totalmente compatível com Linux. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs com WhatsApp/Telegram).

Apps complementares nativos para Linux estão planejados. Contribuições são bem-vindas se você quiser ajudar a construir um.

## Caminho rápido para iniciantes (VPS)

1. Instale Node 24 (recomendado; Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Do seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e autentique com o segredo compartilhado configurado (token por padrão; senha se você definiu `gateway.auth.mode: "password"`)

Guia completo de servidor Linux: [Linux Server](/pt-BR/vps). Exemplo passo a passo de VPS: [exe.dev](/pt-BR/install/exe-dev)

## Instalação

- [Getting Started](/pt-BR/start/getting-started)
- [Install & updates](/pt-BR/install/updating)
- Fluxos opcionais: [Bun (experimental)](/pt-BR/install/bun), [Nix](/pt-BR/install/nix), [Docker](/pt-BR/install/docker)

## Gateway

- [Gateway runbook](/pt-BR/gateway)
- [Configuration](/pt-BR/gateway/configuration)

## Instalação do serviço do gateway (CLI)

Use um destes:

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

Selecione **Gateway service** quando solicitado.

Reparar/migrar:

```
openclaw doctor
```

## Controle do sistema (unidade de usuário systemd)

O OpenClaw instala por padrão um serviço **de usuário** do systemd. Use um serviço **de sistema**
para servidores compartilhados ou sempre ativos. `openclaw gateway install` e
`openclaw onboard --install-daemon` já geram para você a unidade canônica atual;
escreva uma manualmente apenas quando precisar de uma configuração personalizada do sistema/gerenciador
de serviços. A orientação completa de serviço fica no [Gateway runbook](/pt-BR/gateway).

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

Habilite:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressão de memória e encerramentos por OOM

No Linux, o kernel escolhe uma vítima de OOM quando um host, VM ou cgroup de contêiner
fica sem memória. O Gateway pode ser uma vítima ruim porque mantém sessões de longa duração
e conexões de canal. Por isso, o OpenClaw tende a fazer com que processos filhos transitórios
sejam mortos antes do Gateway, quando possível.

Para spawns elegíveis de processos filhos no Linux, o OpenClaw inicia o filho por um pequeno
wrapper `/bin/sh` que eleva o `oom_score_adj` do próprio filho para `1000`, depois
faz `exec` do comando real. Esta é uma operação sem privilégios porque o filho está
apenas aumentando sua própria probabilidade de ser morto por OOM.

Superfícies cobertas de processos filhos incluem:

- filhos de comando gerenciados pelo supervisor,
- filhos de shell PTY,
- filhos de servidor MCP stdio,
- processos de browser/Chrome iniciados pelo OpenClaw.

O wrapper é exclusivo para Linux e é ignorado quando `/bin/sh` não está disponível. Ele
também é ignorado se o env do filho definir `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Para verificar um processo filho:

```bash
cat /proc/<child-pid>/oom_score_adj
```

O valor esperado para filhos cobertos é `1000`. O processo do Gateway deve manter
sua pontuação normal, normalmente `0`.

Isso não substitui o ajuste normal de memória. Se uma VPS ou contêiner continuar
matando filhos repetidamente, aumente o limite de memória, reduza a concorrência
ou adicione controles mais fortes de recursos, como `MemoryMax=` do systemd ou limites de memória no nível do contêiner.

## Relacionados

- [Install overview](/pt-BR/install)
- [Linux server](/pt-BR/vps)
- [Raspberry Pi](/pt-BR/install/raspberry-pi)
