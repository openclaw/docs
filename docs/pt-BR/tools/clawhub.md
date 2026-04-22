---
read_when:
    - Apresentando o ClawHub para novos usuários
    - Instalando, pesquisando ou publicando Skills ou plugins
    - Explicando flags da CLI do ClawHub e comportamento de sincronização
summary: 'Guia do ClawHub: registro público, fluxos nativos de instalação do OpenClaw e fluxos de trabalho da CLI do ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub é o registro público para **Skills e plugins do OpenClaw**.

- Use comandos nativos do `openclaw` para pesquisar/instalar/atualizar Skills e instalar
  plugins do ClawHub.
- Use a CLI separada `clawhub` quando precisar de autenticação no registro, publicar, excluir,
  restaurar exclusão ou fluxos de sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Fluxos nativos do OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Especificações de plugin seguras para npm sem prefixo também são tentadas no ClawHub antes do npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Comandos nativos do `openclaw` instalam no seu workspace ativo e persistem
metadados de origem para que chamadas posteriores de `update` possam permanecer no ClawHub.

Instalações de plugins validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes de a instalação do arquivo começar, então hosts incompatíveis falham de forma fechada
cedo, em vez de instalar parcialmente o pacote.

`openclaw plugins install clawhub:...` aceita apenas famílias de plugins instaláveis.
Se um pacote do ClawHub for na verdade uma skill, o OpenClaw para e direciona você para
`openclaw skills install <slug>`.

## O que é o ClawHub

- Um registro público para Skills e plugins do OpenClaw.
- Um armazenamento versionado de bundles de skill e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

## Como funciona

1. Um usuário publica um bundle de skill (arquivos + metadados).
2. O ClawHub armazena o bundle, interpreta os metadados e atribui uma versão.
3. O registro indexa a skill para pesquisa e descoberta.
4. Os usuários navegam, baixam e instalam Skills no OpenClaw.

## O que você pode fazer

- Publicar novas Skills e novas versões de Skills existentes.
- Descobrir Skills por nome, tags ou pesquisa.
- Baixar bundles de skill e inspecionar seus arquivos.
- Denunciar Skills abusivas ou inseguras.
- Se você for moderador, ocultar, reexibir, excluir ou banir.

## Para quem isso é (amigável para iniciantes)

Se você quiser adicionar novos recursos ao seu agente OpenClaw, o ClawHub é a forma mais fácil de encontrar e instalar Skills. Você não precisa saber como o backend funciona. Você pode:

- Pesquisar Skills em linguagem natural.
- Instalar uma skill no seu workspace.
- Atualizar Skills depois com um comando.
- Fazer backup das suas próprias Skills publicando-as.

## Início rápido (não técnico)

1. Pesquise algo de que você precisa:
   - `openclaw skills search "calendar"`
2. Instale uma skill:
   - `openclaw skills install <skill-slug>`
3. Inicie uma nova sessão do OpenClaw para que ele reconheça a nova skill.
4. Se quiser publicar ou gerenciar autenticação do registro, instale também a
   CLI separada `clawhub`.

## Instale a CLI do ClawHub

Você só precisa disso para fluxos autenticados no registro, como publicar/sincronizar:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Como isso se encaixa no OpenClaw

`openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. `openclaw plugins install clawhub:...` registra uma instalação de plugin gerenciada normal mais metadados de origem do ClawHub para atualizações.

Instalações anônimas de plugins do ClawHub também falham de forma fechada para pacotes privados.
Canais da comunidade ou outros canais não oficiais ainda podem instalar, mas o OpenClaw avisa
para que operadores revisem a origem e a verificação antes de ativar.

A CLI separada `clawhub` também instala Skills em `./skills` no
diretório de trabalho atual. Se um workspace do OpenClaw estiver configurado, `clawhub`
usa esse workspace como fallback, a menos que você substitua com `--workdir` (ou
`CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do workspace de `<workspace>/skills`
e as reconhecerá na **próxima** sessão. Se você já usa
`~/.openclaw/skills` ou Skills incluídas, as Skills do workspace têm precedência.

Para mais detalhes sobre como Skills são carregadas, compartilhadas e controladas, consulte
[Skills](/pt-BR/tools/skills).

## Visão geral do sistema de Skills

Uma skill é um bundle versionado de arquivos que ensina o OpenClaw a executar uma
tarefa específica. Cada publicação cria uma nova versão, e o registro mantém um
histórico de versões para que os usuários possam auditar mudanças.

Uma skill típica inclui:

- Um arquivo `SKILL.md` com a descrição principal e o uso.
- Configurações, scripts ou arquivos de suporte opcionais usados pela skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor recursos de skill com segurança.
O registro também acompanha sinais de uso (como estrelas e downloads) para melhorar
o ranking e a visibilidade.

## O que o serviço fornece (recursos)

- **Navegação pública** de Skills e do conteúdo `SKILL.md` delas.
- **Pesquisa** com embeddings (busca vetorial), não apenas palavras-chave.
- **Versionamento** com semver, changelogs e tags (incluindo `latest`).
- **Downloads** como zip por versão.
- **Estrelas e comentários** para feedback da comunidade.
- **Hooks de moderação** para aprovações e auditorias.
- **API amigável para CLI** para automação e scripts.

## Segurança e moderação

O ClawHub é aberto por padrão. Qualquer pessoa pode enviar Skills, mas uma conta do GitHub precisa
ter pelo menos uma semana de existência para publicar. Isso ajuda a desacelerar abusos sem bloquear
colaboradores legítimos.

Denúncias e moderação:

- Qualquer usuário autenticado pode denunciar uma skill.
- Motivos de denúncia são obrigatórios e registrados.
- Cada usuário pode ter até 20 denúncias ativas ao mesmo tempo.
- Skills com mais de 3 denúncias únicas são ocultadas automaticamente por padrão.
- Moderadores podem ver Skills ocultadas, reexibi-las, excluí-las ou banir usuários.
- Abusar do recurso de denúncia pode resultar em banimento da conta.

Tem interesse em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um
moderador ou mantenedor.

## Comandos e parâmetros da CLI

Opções globais (aplicam-se a todos os comandos):

- `--workdir <dir>`: Diretório de trabalho (padrão: diretório atual; usa workspace do OpenClaw como fallback).
- `--dir <dir>`: Diretório de Skills, relativo ao diretório de trabalho (padrão: `skills`).
- `--site <url>`: URL base do site (login no navegador).
- `--registry <url>`: URL base da API do registro.
- `--no-input`: Desativar prompts (não interativo).
- `-V, --cli-version`: Imprimir a versão da CLI.

Autenticação:

- `clawhub login` (fluxo no navegador) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opções:

- `--token <token>`: Cole um token de API.
- `--label <label>`: Rótulo armazenado para tokens de login no navegador (padrão: `CLI token`).
- `--no-browser`: Não abrir um navegador (requer `--token`).

Pesquisa:

- `clawhub search "query"`
- `--limit <n>`: Máximo de resultados.

Instalação:

- `clawhub install <slug>`
- `--version <version>`: Instalar uma versão específica.
- `--force`: Sobrescrever se a pasta já existir.

Atualização:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Atualizar para uma versão específica (apenas um slug).
- `--force`: Sobrescrever quando arquivos locais não correspondem a nenhuma versão publicada.

Listagem:

- `clawhub list` (lê `.clawhub/lock.json`)

Publicar Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug da skill.
- `--name <name>`: Nome de exibição.
- `--version <version>`: Versão semver.
- `--changelog <text>`: Texto do changelog (pode estar vazio).
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).

Publicar plugins:

- `clawhub package publish <source>`
- `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma URL do GitHub.
- `--dry-run`: Montar o plano exato de publicação sem enviar nada.
- `--json`: Emitir saída legível por máquina para CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Substituições opcionais quando a autodetecção não for suficiente.

Excluir/restaurar exclusão (somente proprietário/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizar (varrer Skills locais + publicar novas/atualizadas):

- `clawhub sync`
- `--root <dir...>`: Raízes adicionais para varredura.
- `--all`: Enviar tudo sem prompts.
- `--dry-run`: Mostrar o que seria enviado.
- `--bump <type>`: `patch|minor|major` para atualizações (padrão: `patch`).
- `--changelog <text>`: Changelog para atualizações não interativas.
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).
- `--concurrency <n>`: Verificações do registro (padrão: 4).

## Fluxos de trabalho comuns para agentes

### Pesquisar Skills

```bash
clawhub search "postgres backups"
```

### Baixar novas Skills

```bash
clawhub install my-skill-pack
```

### Atualizar Skills instaladas

```bash
clawhub update --all
```

### Fazer backup das suas Skills (publicar ou sincronizar)

Para uma única pasta de skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para varrer e fazer backup de muitas Skills de uma vez:

```bash
clawhub sync --all
```

### Publicar um plugin do GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugins de código precisam incluir os metadados exigidos do OpenClaw em `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Pacotes publicados devem incluir JavaScript já compilado e apontar `runtimeExtensions`
para essa saída. Instalações a partir de checkout Git ainda podem usar TypeScript-fonte
como fallback quando não existirem arquivos compilados, mas entradas de runtime compiladas evitam
compilação de TypeScript em tempo de execução nos caminhos de inicialização, doctor e carregamento de plugins.

## Detalhes avançados (técnicos)

### Versionamento e tags

- Cada publicação cria uma nova `SkillVersion` **semver**.
- Tags (como `latest`) apontam para uma versão; mover tags permite fazer rollback.
- Changelogs são anexados por versão e podem estar vazios ao sincronizar ou publicar atualizações.

### Mudanças locais vs versões do registro

Atualizações comparam o conteúdo local da skill com versões do registro usando um hash de conteúdo. Se arquivos locais não corresponderem a nenhuma versão publicada, a CLI pergunta antes de sobrescrever (ou exige `--force` em execuções não interativas).

### Varredura de sincronização e raízes de fallback

`clawhub sync` varre primeiro o diretório de trabalho atual. Se nenhuma skill for encontrada, ele usa como fallback locais legados conhecidos (por exemplo `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para encontrar instalações mais antigas de skill sem flags extras.

### Armazenamento e lockfile

- Skills instaladas são registradas em `.clawhub/lock.json` no seu diretório de trabalho.
- Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substitua via `CLAWHUB_CONFIG_PATH`).

### Telemetria (contagens de instalação)

Quando você executa `clawhub sync` enquanto está autenticado, a CLI envia um snapshot mínimo para calcular contagens de instalação. Você pode desativar isso totalmente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variáveis de ambiente

- `CLAWHUB_SITE`: Substituir a URL do site.
- `CLAWHUB_REGISTRY`: Substituir a URL da API do registro.
- `CLAWHUB_CONFIG_PATH`: Substituir onde a CLI armazena o token/configuração.
- `CLAWHUB_WORKDIR`: Substituir o diretório de trabalho padrão.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Desativar telemetria em `sync`.
