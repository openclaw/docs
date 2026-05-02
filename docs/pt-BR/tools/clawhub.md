---
read_when:
    - Pesquisar, instalar ou atualizar Skills ou plugins
    - Publicando Skills ou Plugins no registro
    - Configurando a CLI do ClawHub ou suas sobrescritas de ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro público de Skills e Plugins do OpenClaw, fluxos de instalação nativos e a CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T05:57:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub é o registro público para **Skills e plugins do OpenClaw**.

- Use comandos nativos do `openclaw` para pesquisar, instalar e atualizar Skills, e para instalar plugins do ClawHub.
- Use a CLI `clawhub` separada para fluxos de autenticação no registro, publicação, exclusão/restauração e sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

<Steps>
  <Step title="Pesquisar">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalar">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Usar">
    Inicie uma nova sessão do OpenClaw — ela detecta a nova Skill.
  </Step>
  <Step title="Publicar (opcional)">
    Para fluxos autenticados no registro (publicar, sincronizar, gerenciar), instale
    a CLI `clawhub` separada:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Fluxos nativos do OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Os comandos nativos do `openclaw` instalam no seu espaço de trabalho ativo e
    preservam metadados de origem para que chamadas posteriores de `update` possam permanecer no ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` consulta o catálogo de plugins do ClawHub e imprime nomes
    de pacotes prontos para instalação. Especificações simples de plugins seguras para npm também são testadas no ClawHub
    antes do npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Use `npm:<package>` quando quiser resolução somente via npm, sem uma
    consulta ao ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    As instalações de plugins validam a compatibilidade anunciada de `pluginApi` e
    `minGatewayVersion` antes da instalação do arquivo ser executada, para que
    hosts incompatíveis falhem de forma fechada cedo, em vez de instalar parcialmente
    o pacote. Quando uma versão de pacote publica um artefato ClawPack,
    o OpenClaw prefere esse artefato, verifica o cabeçalho de resumo do ClawHub e
    os bytes baixados, e registra os metadados de resumo do ClawPack para
    atualizações posteriores. Versões de pacote mais antigas sem metadados ClawPack ainda usam o
    caminho legado de verificação de arquivo de pacote.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` aceita apenas famílias de plugins
instaláveis. Se um pacote do ClawHub for, na verdade, uma Skill, o OpenClaw interrompe e
direciona você para `openclaw skills install <slug>`.

Instalações anônimas de plugins do ClawHub também falham de forma fechada para pacotes privados.
Canais comunitários ou outros canais não oficiais ainda podem ser instalados, mas o OpenClaw
avisa para que operadores possam revisar a origem e a verificação antes de habilitá-los.
</Note>

## O que é o ClawHub

- Um registro público para Skills e plugins do OpenClaw.
- Um repositório versionado de pacotes de Skills e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

Uma Skill típica é um pacote versionado de arquivos que inclui:

- Um arquivo `SKILL.md` com a descrição principal e o uso.
- Configurações, scripts ou arquivos de apoio opcionais usados pela Skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor com segurança as
capacidades das Skills. O registro acompanha sinais de uso (estrelas, downloads) para
melhorar a classificação e a visibilidade. Cada publicação cria uma nova versão
semver, e o registro mantém o histórico de versões para que usuários possam auditar
alterações.

## Espaço de trabalho e carregamento de Skills

A CLI `clawhub` separada também instala Skills em `./skills` dentro do
seu diretório de trabalho atual. Se um espaço de trabalho do OpenClaw estiver configurado,
`clawhub` usa esse espaço de trabalho como fallback, a menos que você substitua `--workdir`
(ou `CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do espaço de trabalho a partir de
`<workspace>/skills` e as detecta na **próxima** sessão.

Se você já usa `~/.openclaw/skills` ou Skills incluídas, as Skills do espaço de trabalho
têm precedência. Para mais detalhes sobre como Skills são carregadas,
compartilhadas e controladas, consulte [Skills](/pt-BR/tools/skills).

## Recursos do serviço

| Recurso                  | Observações                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navegação pública          | Skills e o conteúdo de `SKILL.md` delas são visíveis publicamente.          |
| Pesquisa                   | Baseada em embeddings (pesquisa vetorial), não apenas palavras-chave.               |
| Versionamento               | Semver, changelogs e tags (incluindo `latest`).                  |
| Downloads                | Zip por versão.                                                    |
| Estrelas e comentários       | Feedback da comunidade.                                                 |
| Resumos de verificação de segurança  | Páginas de detalhes mostram o estado da verificação mais recente antes da instalação ou do download. |
| Páginas de detalhes do scanner     | Resultados do VirusTotal, ClawScan e de análise estática têm links diretos.  |
| Painel de recuperação do proprietário | Publicadores podem ver conteúdo próprio retido por verificação em `/dashboard`.       |
| Reverificações solicitadas pelo proprietário  | Proprietários podem solicitar reverificações limitadas para recuperação de falso positivo.     |
| Moderação               | Aprovações e auditorias.                                               |
| API amigável para CLI         | Adequada para automação e scripts.                              |

## Segurança e moderação

O ClawHub é aberto por padrão — qualquer pessoa pode enviar Skills, mas uma conta
do GitHub deve ter **pelo menos uma semana de idade** para publicar. Isso reduz
abusos sem bloquear colaboradores legítimos.

<AccordionGroup>
  <Accordion title="Verificações de segurança">
    O ClawHub executa verificações de segurança automatizadas em Skills publicadas e lançamentos de plugins.
    As páginas públicas de detalhes resumem o resultado atual, e as linhas de scanner
    apontam para páginas de detalhes dedicadas para VirusTotal, ClawScan e análise
    estática.

    Lançamentos retidos por verificação ou bloqueados podem ficar indisponíveis no catálogo público e
    nas superfícies de instalação, mas ainda visíveis para seu proprietário em `/dashboard`.

  </Accordion>
  <Accordion title="Denúncias">
    - Qualquer usuário conectado pode denunciar uma Skill.
    - Motivos de denúncia são obrigatórios e registrados.
    - Cada usuário pode ter até 20 denúncias ativas ao mesmo tempo.
    - Skills com mais de 3 denúncias únicas são ocultadas automaticamente por padrão.

  </Accordion>
  <Accordion title="Moderação">
    - Moderadores podem ver Skills ocultas, reexibi-las, excluí-las ou banir usuários.
    - Abusar do recurso de denúncia pode resultar em banimento da conta.
    - Tem interesse em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um moderador ou mantenedor.

  </Accordion>
</AccordionGroup>

## CLI do ClawHub

Você só precisa disso para fluxos autenticados no registro, como
publicação/sincronização.

### Opções globais

<ParamField path="--workdir <dir>" type="string">
  Diretório de trabalho. Padrão: diretório atual; usa como fallback o espaço de trabalho do OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Diretório de Skills, relativo ao workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base do site (login pelo navegador).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base da API do registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Desabilita prompts (não interativo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Imprime a versão da CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opções de login:

    - `--token <token>` — cole um token de API.
    - `--label <label>` — rótulo armazenado para tokens de login pelo navegador (padrão: `CLI token`).
    - `--no-browser` — não abre um navegador (requer `--token`).

  </Accordion>
  <Accordion title="Pesquisa">
    ```bash
    clawhub search "query"
    ```

    Pesquisa Skills. Para descoberta de plugin/pacote, use `clawhub package explore`.

    - `--limit <n>` — resultados máximos.

  </Accordion>
  <Accordion title="Navegar / inspecionar plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` e `package inspect` são as superfícies da CLI do ClawHub para descoberta de plugins/pacotes e inspeção de metadados. Instalações nativas do OpenClaw ainda usam `openclaw plugins install clawhub:<package>`.

    Opções:

    - `--family skill|code-plugin|bundle-plugin` — filtra a família do pacote.
    - `--official` — mostra apenas pacotes oficiais.
    - `--executes-code` — mostra apenas pacotes que executam código.
    - `--version <version>` / `--tag <tag>` — inspeciona uma versão específica do pacote.
    - `--versions`, `--files`, `--file <path>` — inspeciona histórico e arquivos do pacote.
    - `--json` — saída legível por máquina.

  </Accordion>
  <Accordion title="Instalar / atualizar / listar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opções:

    - `--version <version>` — instala ou atualiza para uma versão específica (slug único apenas em `update`).
    - `--force` — sobrescreve se a pasta já existir, ou quando arquivos locais não corresponderem a nenhuma versão publicada.
    - `clawhub list` lê `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publicar Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opções:

    - `--slug <slug>` — slug da Skill.
    - `--name <name>` — nome de exibição.
    - `--version <version>` — versão semver.
    - `--changelog <text>` — texto do changelog (pode ficar vazio).
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).

  </Accordion>
  <Accordion title="Publicar plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma
    URL do GitHub.

    Opções:

    - `--dry-run` — cria o plano de publicação exato sem enviar nada.
    - `--json` — emite saída legível por máquina para CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — substituições opcionais quando a detecção automática não é suficiente.

  </Accordion>
  <Accordion title="Solicitar reverificações">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Comandos de reverificação exigem um token de proprietário conectado e miram a versão
    publicada mais recente da Skill ou o lançamento de plugin. Em execuções não interativas, passe
    `--yes`.

    Respostas JSON incluem o tipo do alvo, nome, versão, status da reverificação e
    contagens de solicitações restantes/máximas para essa versão ou lançamento.

  </Accordion>
  <Accordion title="Excluir / restaurar (proprietário ou administrador)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizar (verificar localmente + publicar novo ou atualizado)">
    ```bash
    clawhub sync
    ```

    Opções:

    - `--root <dir...>` — raízes de verificação extras.
    - `--all` — envia tudo sem prompts.
    - `--dry-run` — mostra o que seria enviado.
    - `--bump <type>` — `patch|minor|major` para atualizações (padrão: `patch`).
    - `--changelog <text>` — changelog para atualizações não interativas.
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).
    - `--concurrency <n>` — verificações no registro (padrão: `4`).

  </Accordion>
</AccordionGroup>

## Fluxos de trabalho comuns

<Tabs>
  <Tab title="Pesquisa">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Encontrar um Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Instalar">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Atualizar tudo">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publicar uma única skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar muitas skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar um Plugin do GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadados do pacote Plugin

Plugins de código devem incluir os metadados obrigatórios do OpenClaw em
`package.json`:

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

Pacotes publicados devem incluir **JavaScript compilado** e apontar
`runtimeExtensions` para essa saída. Instalações via checkout do Git ainda podem
recorrer ao código-fonte TypeScript quando não houver arquivos compilados, mas entradas de runtime compiladas
evitam a compilação TypeScript em runtime nos caminhos de inicialização, doctor e
carregamento de Plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tags">
    - Cada publicação cria uma nova `SkillVersion` **semver**.
    - Tags (como `latest`) apontam para uma versão; mover tags permite reverter.
    - Changelogs são anexados por versão e podem ficar vazios ao sincronizar ou publicar atualizações.

  </Accordion>
  <Accordion title="Alterações locais vs versões do registro">
    Atualizações comparam o conteúdo local da skill com as versões do registro usando um
    hash de conteúdo. Se os arquivos locais não corresponderem a nenhuma versão publicada, a
    CLI pergunta antes de sobrescrever (ou exige `--force` em
    execuções não interativas).
  </Accordion>
  <Accordion title="Varredura de sincronização e raízes alternativas">
    `clawhub sync` verifica primeiro seu diretório de trabalho atual. Se nenhuma skill for
    encontrada, ele recorre a locais legados conhecidos (por exemplo,
    `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para
    encontrar instalações antigas de skills sem flags extras.
  </Accordion>
  <Accordion title="Armazenamento e lockfile">
    - Skills instaladas são registradas em `.clawhub/lock.json` no seu diretório de trabalho.
    - Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substitua via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (contagens de instalação)">
    Quando você executa `clawhub sync` enquanto está conectado, a CLI envia um snapshot
    mínimo para calcular contagens de instalação. Você pode desativar isso totalmente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

| Variável                      | Efeito                                                |
| ----------------------------- | ----------------------------------------------------- |
| `CLAWHUB_SITE`                | Substitui a URL do site.                              |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.                   |
| `CLAWHUB_CONFIG_PATH`         | Substitui onde a CLI armazena o token/configuração.   |
| `CLAWHUB_WORKDIR`             | Substitui o diretório de trabalho padrão.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria em `sync`.                      |

## Relacionados

- [Plugins da comunidade](/pt-BR/plugins/community)
- [Plugins](/pt-BR/tools/plugin)
- [Skills](/pt-BR/tools/skills)
