---
read_when:
    - Você está implantando o OpenClaw em uma VM na nuvem com Docker
    - Você precisa do fluxo compartilhado de preparação do binário, persistência e atualização
summary: Etapas de execução em VM Docker compartilhada para hosts de Gateway OpenClaw de longa duração
title: Runtime de VM do Docker
x-i18n:
    generated_at: "2026-07-12T15:17:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Etapas de runtime compartilhadas para instalações do Docker baseadas em VM, como GCP, Hetzner e provedores de VPS semelhantes.

## Inclua os binários necessários na imagem

Instalar binários dentro de um contêiner em execução é uma armadilha: tudo o que for instalado
durante o runtime será perdido na reinicialização. Inclua na imagem, durante a compilação,
todos os binários externos necessários para uma skill.

Os exemplos abaixo abrangem apenas três binários, em ordem alfabética:

- `gog` (do `gogcli`) para acesso ao Gmail
- `goplaces` para o Google Places
- `wacli` para o WhatsApp

Estes são exemplos, não uma lista completa. Instale quantos binários forem necessários para suas
skills usando o mesmo padrão. Quando você adicionar posteriormente uma skill que precise de um novo
binário:

1. Atualize o Dockerfile.
2. Recompile a imagem.
3. Reinicie os contêineres.

**Exemplo de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Exemplo de binário 1: CLI do Gmail (gogcli — instalado como `gog`)
# Copie a URL atual do artefato para Linux de https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Exemplo de binário 2: CLI do Google Places
# Copie a URL atual do artefato para Linux de https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Exemplo de binário 3: CLI do WhatsApp
# Copie a URL atual do artefato para Linux de https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Adicione mais binários abaixo usando o mesmo padrão

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
As URLs acima são exemplos. Para VMs baseadas em ARM, escolha os artefatos `arm64`. Para compilações reproduzíveis, fixe URLs de versões específicas.
</Note>

## Compile e inicie

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se a compilação falhar com `Killed` ou o código de saída 137 durante `pnpm install --frozen-lockfile`, a VM está sem memória. Use uma classe de máquina maior antes de tentar novamente.

Verifique os binários:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Saída esperada:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifique se o Gateway está em execução:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

O retorno de uma resposta 200 por `/healthz` confirma que o processo do Gateway está escutando e íntegro; o `HEALTHCHECK` integrado à imagem consulta o mesmo endpoint.

## O que persiste e onde

O OpenClaw é executado no Docker, mas o Docker não é a fonte da verdade. Todo estado de longa duração deve sobreviver a reinicializações, recompilações e reinícios da máquina.

| Componente                    | Localização                                            | Mecanismo de persistência    | Observações                                                                                                             |
| ----------------------------- | ------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Configuração do Gateway       | `/home/node/.openclaw/`                                | Montagem de volume do host   | Inclui `openclaw.json`                                                                                                  |
| Credenciais de canal/provedor | `/home/node/.openclaw/credentials/`                    | Montagem de volume do host   | Material de credenciais de canais e provedores                                                                          |
| Perfis de autenticação de modelo | `/home/node/.openclaw/agents/`                      | Montagem de volume do host   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chaves de API)                                                       |
| Arquivo legado de chaves OAuth | `/home/node/.config/openclaw/`                        | Montagem de volume do host   | Compatibilidade somente leitura para arquivos auxiliares OAuth anteriores à migração; `openclaw doctor --fix` os migra para `auth-profiles.json` |
| Configurações de skills       | `/home/node/.openclaw/skills/`                         | Montagem de volume do host   | Estado no nível da skill                                                                                                 |
| Workspace do agente           | `/home/node/.openclaw/workspace/`                      | Montagem de volume do host   | Código e artefatos do agente                                                                                             |
| Sessão do WhatsApp            | `/home/node/.openclaw/`                                | Montagem de volume do host   | Preserva o login por QR                                                                                                  |
| Chaveiro do Gmail             | `/home/node/.openclaw/`                                | Volume do host + senha       | Requer `GOG_KEYRING_PASSWORD`                                                                                            |
| Pacotes de plugins            | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montagem de volume do host   | Raízes dos pacotes de plugins disponíveis para download                                                                 |
| Binários externos             | `/usr/local/bin/`                                      | Imagem do Docker             | Devem ser incluídos durante a compilação                                                                                 |
| Runtime do Node               | Sistema de arquivos do contêiner                       | Imagem do Docker             | Recompilado a cada compilação da imagem                                                                                  |
| Pacotes do SO                 | Sistema de arquivos do contêiner                       | Imagem do Docker             | Não instale durante o runtime                                                                                            |
| Contêiner do Docker           | Efêmero                                                | Reinicializável              | Pode ser destruído com segurança                                                                                         |

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
