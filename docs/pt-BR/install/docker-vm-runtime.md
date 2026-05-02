---
read_when:
    - Você está implantando o OpenClaw em uma VM na nuvem com Docker
    - Você precisa da geração do binário compartilhado, da persistência e do fluxo de atualização
summary: Etapas compartilhadas de tempo de execução da VM Docker para hosts OpenClaw Gateway de longa duração
title: Runtime da VM do Docker
x-i18n:
    generated_at: "2026-05-02T05:50:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Etapas de runtime compartilhadas para instalações Docker baseadas em VM, como GCP, Hetzner e provedores VPS semelhantes.

## Incorpore os binários necessários à imagem

Instalar binários dentro de um contêiner em execução é uma armadilha.
Qualquer coisa instalada em runtime será perdida na reinicialização.

Todos os binários externos exigidos por Skills devem ser instalados no momento de build da imagem.

Os exemplos abaixo mostram apenas três binários comuns:

- `gog` (de `gogcli`) para acesso ao Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Estes são exemplos, não uma lista completa.
Você pode instalar quantos binários forem necessários usando o mesmo padrão.

Se adicionar novas Skills posteriormente que dependam de binários adicionais, você deve:

1. Atualizar o Dockerfile
2. Recriar a imagem
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
As URLs acima são exemplos. Para VMs baseadas em ARM, escolha os assets `arm64`. Para builds reproduzíveis, fixe URLs de releases versionados.
</Note>

## Build e inicialização

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

O OpenClaw é executado no Docker, mas o Docker não é a fonte da verdade.
Todo estado de longa duração deve sobreviver a reinicializações, rebuilds e reinícios da máquina.

| Componente          | Localização                                            | Mecanismo de persistência | Observações                                                   |
| ------------------- | ------------------------------------------------------ | ------------------------- | ------------------------------------------------------------- |
| Configuração do Gateway | `/home/node/.openclaw/`                                | Montagem de volume do host | Inclui `openclaw.json`, `.env`                                |
| Perfis de autenticação de modelo | `/home/node/.openclaw/agents/`                         | Montagem de volume do host | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chaves de API) |
| Configurações de Skills | `/home/node/.openclaw/skills/`                         | Montagem de volume do host | Estado no nível de Skill                                      |
| Workspace do agente | `/home/node/.openclaw/workspace/`                      | Montagem de volume do host | Código e artefatos do agente                                  |
| Sessão do WhatsApp  | `/home/node/.openclaw/`                                | Montagem de volume do host | Preserva o login por QR                                       |
| Keyring do Gmail    | `/home/node/.openclaw/`                                | Volume do host + senha    | Requer `GOG_KEYRING_PASSWORD`                                 |
| Pacotes de Plugin   | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montagem de volume do host | Raízes de pacotes de Plugin baixáveis                         |
| Binários externos   | `/usr/local/bin/`                                      | Imagem Docker             | Devem ser incorporados no momento de build                    |
| Runtime do Node     | Sistema de arquivos do contêiner                       | Imagem Docker             | Recriado a cada build de imagem                               |
| Pacotes do SO       | Sistema de arquivos do contêiner                       | Imagem Docker             | Não instale em runtime                                        |
| Contêiner Docker    | Efêmero                                                | Reiniciável               | Seguro para destruir                                          |

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
