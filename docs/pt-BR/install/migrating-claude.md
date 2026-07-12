---
read_when:
    - Você está migrando do Claude Code ou Claude Desktop e quer manter instruções, servidores MCP e Skills
    - Você precisa entender o que o OpenClaw importa automaticamente e o que permanece apenas no arquivo morto
summary: Mova o estado local do Claude Code e do Claude Desktop para o OpenClaw com uma importação pré-visualizada
title: Migração do Claude
x-i18n:
    generated_at: "2026-07-12T00:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

O OpenClaw importa o estado local do Claude por meio do provedor de migração do Claude incluído. O provedor apresenta uma prévia de cada item antes de alterar o estado, oculta segredos nos planos e relatórios e cria um backup verificado antes da aplicação.

<Note>
As importações durante a integração exigem uma configuração nova do OpenClaw. Se você já tiver um estado local do OpenClaw, primeiro redefina a configuração, as credenciais, as sessões e o espaço de trabalho ou use `openclaw migrate` diretamente com `--overwrite` após revisar o plano.
</Note>

## Duas maneiras de importar

<Tabs>
  <Tab title="Assistente de integração">
    O assistente oferece o Claude quando detecta um estado local do Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Ou indique uma origem específica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para execuções automatizadas por script ou repetíveis. Consulte [`openclaw migrate`](/pt-BR/cli/migrate) para ver a referência completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Adicione `--from <path>` para importar um diretório inicial ou a raiz de um projeto específico do Claude Code.

  </Tab>
</Tabs>

## O que é importado

<AccordionGroup>
  <Accordion title="Instruções e memória">
    - O conteúdo de `CLAUDE.md` e `.claude/CLAUDE.md` do projeto é copiado ou anexado ao `AGENTS.md` no espaço de trabalho do agente do OpenClaw.
    - O conteúdo de `~/.claude/CLAUDE.md` do usuário é anexado ao `USER.md` do espaço de trabalho.

  </Accordion>
  <Accordion title="Servidores MCP">
    As definições de servidores MCP são importadas de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop, quando presentes.
  </Accordion>
  <Accordion title="Skills e comandos">
    - As Skills do Claude que contêm um arquivo `SKILL.md` são copiadas para o diretório de Skills do espaço de trabalho do OpenClaw.
    - Os arquivos Markdown de comandos do Claude em `.claude/commands/` ou `~/.claude/commands/` são convertidos em Skills do OpenClaw com `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## O que permanece somente no arquivo

O provedor copia os itens a seguir para o relatório de migração, para revisão manual, mas **não** os carrega na configuração ativa do OpenClaw:

- Ganchos do Claude
- Permissões e listas amplas de ferramentas permitidas do Claude
- Padrões de ambiente do Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes do Claude em `.claude/agents/` ou `~/.claude/agents/`
- Diretórios de cache, planos e histórico de projetos do Claude Code
- Extensões do Claude Desktop e credenciais armazenadas pelo sistema operacional

O OpenClaw se recusa a executar ganchos, confiar em listas de permissões ou decodificar automaticamente estados opacos de credenciais do OAuth e do Desktop. Após revisar o arquivo, transfira manualmente o que for necessário.

## Seleção da origem

Sem `--from`, o OpenClaw inspeciona o diretório inicial padrão do Claude Code em `~/.claude`, o arquivo de estado amostrado `~/.claude.json` do Claude Code e a configuração MCP do Claude Desktop no macOS.

Quando `--from` aponta para a raiz de um projeto, o OpenClaw importa somente os arquivos do Claude desse projeto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` e `.mcp.json`. Ele não lê o diretório inicial global do Claude durante a importação da raiz de um projeto.

## Fluxo recomendado

<Steps>
  <Step title="Visualize o plano">
    ```bash
    openclaw migrate claude --dry-run
    ```

    O plano lista tudo o que será alterado, incluindo conflitos, itens ignorados e valores sensíveis ocultados nos campos `env` ou `headers` aninhados do MCP.

  </Step>
  <Step title="Aplique com backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    O OpenClaw cria e verifica um backup antes da aplicação.

  </Step>
  <Step title="Execute o diagnóstico">
    ```bash
    openclaw doctor
    ```

    O [diagnóstico](/pt-BR/gateway/doctor) verifica se há problemas de configuração ou estado após a importação.

  </Step>
  <Step title="Reinicie e verifique">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme se o Gateway está íntegro e se as instruções, os servidores MCP e as Skills importados foram carregados.

  </Step>
</Steps>

## Tratamento de conflitos

A aplicação se recusa a continuar quando o plano relata conflitos — isto é, quando um arquivo ou valor de configuração já existe no destino.

<Warning>
Execute novamente com `--overwrite` somente quando a substituição do destino existente for intencional. Os provedores ainda podem gravar backups de cada item dos arquivos substituídos no diretório do relatório de migração.
</Warning>

Em uma instalação nova do OpenClaw, conflitos são incomuns. Geralmente, eles aparecem quando você executa novamente a importação em uma configuração que já contém edições do usuário.

## Saída JSON para automação

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` é obrigatório para `migrate apply` fora de um terminal interativo; sem essa opção, o OpenClaw retorna um erro em vez de aplicar as alterações. Portanto, scripts e sistemas de integração contínua devem fornecer `--yes` explicitamente. Primeiro, visualize com `--dry-run --json` e depois aplique com `--json --yes` quando o plano estiver correto.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O estado do Claude fica fora de ~/.claude">
    Forneça `--from /actual/path` (CLI) ou `--import-source /actual/path` (integração).
  </Accordion>
  <Accordion title="A integração se recusa a importar em uma configuração existente">
    As importações durante a integração exigem uma configuração nova. Redefina o estado e refaça a integração ou use `openclaw migrate apply claude` diretamente, que oferece suporte a `--overwrite` e ao controle explícito de backups.
  </Accordion>
  <Accordion title="Os servidores MCP do Claude Desktop não foram importados">
    O Claude Desktop lê `claude_desktop_config.json` de um caminho específico da plataforma. Aponte `--from` para o diretório desse arquivo se o OpenClaw não o detectar automaticamente.
  </Accordion>
  <Accordion title="Os comandos do Claude se tornaram Skills com a invocação pelo modelo desativada">
    Isso é intencional. Os comandos do Claude são acionados pelo usuário, portanto, o OpenClaw os importa como Skills com `disable-model-invocation: true`. Edite o frontmatter de cada Skill se quiser que o agente as invoque automaticamente.
  </Accordion>
</AccordionGroup>

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência completa da CLI, contrato de Plugin e formatos JSON.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração.
- [Migração do Hermes](/pt-BR/install/migrating-hermes): o outro caminho de importação entre sistemas.
- [Integração](/pt-BR/cli/onboard): fluxo do assistente e opções não interativas.
- [Diagnóstico](/pt-BR/gateway/doctor): verificação de integridade após a migração.
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace): onde ficam `AGENTS.md`, `USER.md` e as Skills.
