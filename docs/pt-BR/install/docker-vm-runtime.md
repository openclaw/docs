---
read_when:
    - Você está implantando o OpenClaw em uma VM na nuvem com Docker
    - Você precisa da geração do binário compartilhado, da persistência e do fluxo de atualização
summary: Etapas de tempo de execução da VM Docker compartilhada para hosts do OpenClaw Gateway de longa duração
title: Ambiente de execução da VM Docker
x-i18n:
    generated_at: "2026-04-30T09:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Etapas compartilhadas de tempo de execução para instalações Docker baseadas em VM, como GCP, Hetzner e provedores VPS semelhantes.

## Inclua os binários necessários na imagem

Instalar binários dentro de um contêiner em execução é uma armadilha.
Qualquer coisa instalada em tempo de execução será perdida na reinicialização.

Todos os binários externos exigidos por Skills devem ser instalados no momento da construção da imagem.

Os exemplos abaixo mostram apenas três binários comuns:

- `gog` (de `gogcli`) para acesso ao Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Estes são exemplos, não uma lista completa.
Você pode instalar quantos binários forem necessários usando o mesmo padrão.

Se você adicionar novas Skills posteriormente que dependam de binários adicionais, deverá:

1. Atualizar o Dockerfile
2. Reconstruir a imagem
3. Reiniciar os contêineres

**Dockerfile de exemplo**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
As URLs acima são exemplos. Para VMs baseadas em ARM, escolha os assets `arm64`. Para builds reprodutíveis, fixe URLs de versões de lançamento.
</Note>

## Compile e inicie

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se o build falhar com `Killed` ou `exit code 137` durante `pnpm install --frozen-lockfile`, a VM está sem memória.
Use uma classe de máquina maior antes de tentar novamente.

Verifique os binários:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Saída esperada:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifique o Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Saída esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## O que persiste onde

O OpenClaw roda no Docker, mas o Docker não é a fonte da verdade.
Todo estado de longa duração deve sobreviver a reinicializações, reconstruções e reinícios.

| Componente             | Localização                              | Mecanismo de persistência | Observações                                                    |
| ---------------------- | ---------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| Configuração do Gateway | `/home/node/.openclaw/`                  | Montagem de volume do host | Inclui `openclaw.json`, `.env`                                 |
| Perfis de autenticação de modelo | `/home/node/.openclaw/agents/`           | Montagem de volume do host | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chaves de API) |
| Configurações de Skills | `/home/node/.openclaw/skills/`           | Montagem de volume do host | Estado no nível de Skills                                      |
| Workspace do agente     | `/home/node/.openclaw/workspace/`        | Montagem de volume do host | Código e artefatos do agente                                   |
| Sessão do WhatsApp      | `/home/node/.openclaw/`                  | Montagem de volume do host | Preserva o login por QR                                        |
| Keyring do Gmail        | `/home/node/.openclaw/`                  | Volume do host + senha     | Requer `GOG_KEYRING_PASSWORD`                                  |
| Dependências de runtime do Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Volume nomeado do Docker   | Dependências de plugins empacotados geradas e espelhos de runtime |
| Binários externos       | `/usr/local/bin/`                        | Imagem Docker              | Devem ser incluídos no momento do build                        |
| Runtime do Node         | Sistema de arquivos do contêiner         | Imagem Docker              | Reconstruído a cada build de imagem                            |
| Pacotes do SO           | Sistema de arquivos do contêiner         | Imagem Docker              | Não instale em tempo de execução                               |
| Contêiner Docker        | Efêmero                                  | Reiniciável                | Seguro destruir                                                |

## Atualizações

Para atualizar o OpenClaw na VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Relacionados

- [Docker](/pt-BR/install/docker)
- [Podman](/pt-BR/install/podman)
- [ClawDock](/pt-BR/install/clawdock)
