---
read_when:
    - Você está transferindo o OpenClaw para um novo laptop ou servidor
    - Você está migrando de outro sistema de agentes e quer preservar o estado
    - Você está atualizando um plugin existente no local
summary: 'Central de migração: importações entre sistemas, transferências entre máquinas e atualizações de plugins'
title: Guia de migração
x-i18n:
    generated_at: "2026-07-12T15:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

O OpenClaw oferece suporte a três caminhos de migração: importar de outro sistema de agentes, mover uma instalação existente para uma nova máquina e atualizar um plugin no local.

## Importar de outro sistema de agentes

Os provedores de migração incluídos trazem instruções, servidores MCP, skills, configuração de modelos e, opcionalmente, chaves de API para o OpenClaw. Os planos são visualizados antes de qualquer alteração, os segredos são ocultados nos relatórios e a aplicação é respaldada por um backup verificado.

<CardGroup cols={2}>
  <Card title="Migrar do Claude" href="/pt-BR/install/migrating-claude" icon="brain">
    Importe o estado do Claude Code e do Claude Desktop, incluindo `CLAUDE.md`, servidores MCP, skills e comandos de projeto.
  </Card>
  <Card title="Migrar do Hermes" href="/pt-BR/install/migrating-hermes" icon="feather">
    Importe a configuração, os provedores, os servidores MCP, a memória, as skills e as chaves compatíveis de `.env` do Hermes.
  </Card>
</CardGroup>

O ponto de entrada da CLI é [`openclaw migrate`](/pt-BR/cli/migrate). A integração inicial também pode oferecer a migração ao detectar uma origem conhecida (`openclaw onboard --flow import`).

## Mover o OpenClaw para uma nova máquina

Copie o **diretório de estado** (`~/.openclaw/` por padrão) e seu **espaço de trabalho** para preservar:

- **Configuração** — `openclaw.json` e todas as configurações do Gateway.
- **Autenticação** — o `auth-profiles.json` de cada agente (chaves de API e OAuth), além de qualquer estado de canal ou provedor em `credentials/`.
- **Sessões** — histórico de conversas e estado dos agentes.
- **Estado dos canais** — login do WhatsApp, sessão do Telegram e similares.
- **Arquivos do espaço de trabalho** — `MEMORY.md`, `USER.md`, skills e prompts.

<Tip>
Execute `openclaw status` na máquina antiga para confirmar o caminho do diretório de estado. Perfis personalizados usam `~/.openclaw-<profile>/` ou um caminho definido por `OPENCLAW_STATE_DIR`.
</Tip>

### Etapas da migração

<Steps>
  <Step title="Parar o gateway e fazer backup">
    Na máquina **antiga**, pare o gateway para que os arquivos não sejam alterados durante a cópia e, em seguida, arquive:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se você usa vários perfis (por exemplo, `~/.openclaw-work`), arquive cada um separadamente.

  </Step>

  <Step title="Instalar o OpenClaw na nova máquina">
    [Instale](/pt-BR/install) a CLI (e o Node, se necessário) na nova máquina. Não há problema se a integração inicial criar um novo `~/.openclaw/` — você o substituirá na próxima etapa.
  </Step>

  <Step title="Copiar o diretório de estado e o espaço de trabalho">
    Transfira o arquivo por `scp`, `rsync -a` ou uma unidade externa e, em seguida, extraia-o:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Confirme que os diretórios ocultos foram incluídos e que a propriedade dos arquivos corresponde ao usuário que executará o gateway.

  </Step>

  <Step title="Executar o Doctor e verificar">
    Na nova máquina, execute o [Doctor](/pt-BR/gateway/doctor) para aplicar as migrações de configuração e reparar os serviços:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Se o Telegram ou o Discord usar a alternativa padrão por variável de ambiente (`TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN`), verifique se o `.env` do diretório de estado migrado contém essas chaves sem imprimir os valores secretos:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

O `openclaw doctor` também emite um aviso quando uma conta padrão habilitada do Telegram ou do Discord não tem um token configurado e a variável de ambiente correspondente não está disponível para o processo do Doctor.

### Problemas comuns

<AccordionGroup>
  <Accordion title="Incompatibilidade de perfil ou diretório de estado">
    Se o gateway antigo usava `--profile` ou `OPENCLAW_STATE_DIR` e o novo não usa, os canais parecerão desconectados e as sessões estarão vazias. Inicie o gateway com o **mesmo** perfil ou diretório de estado que você migrou e execute `openclaw doctor` novamente.
  </Accordion>

  <Accordion title="Copiar apenas openclaw.json">
    O arquivo de configuração sozinho não é suficiente. Os perfis de autenticação dos modelos ficam em `agents/<agentId>/agent/auth-profiles.json`, e o estado dos canais e provedores fica em `credentials/`. Sempre migre o diretório de estado **inteiro**.
  </Accordion>

  <Accordion title="Permissões e propriedade">
    Se você fez a cópia como root ou trocou de usuário, o gateway pode não conseguir ler as credenciais. Certifique-se de que o diretório de estado e o espaço de trabalho pertençam ao usuário que executa o gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Se sua interface aponta para um gateway **remoto**, o host remoto é responsável pelas sessões e pelo espaço de trabalho. Migre o próprio host do gateway, não seu notebook local. Consulte as [Perguntas frequentes](/pt-BR/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segredos em backups">
    O diretório de estado contém perfis de autenticação, credenciais de canais e outros estados de provedores. Armazene os backups criptografados, evite canais de transferência inseguros e altere as chaves se suspeitar de exposição.
  </Accordion>
</AccordionGroup>

### Lista de verificação

Na nova máquina, confirme:

- [ ] `openclaw status` mostra que o gateway está em execução.
- [ ] Os canais continuam conectados (sem necessidade de refazer o pareamento).
- [ ] O painel abre e mostra as sessões existentes.
- [ ] Os arquivos do espaço de trabalho (memória e configurações) estão presentes.

## Atualizar um plugin no local

As atualizações de plugin no local preservam o mesmo ID do plugin e as mesmas chaves de configuração, mas podem mover o estado armazenado em disco para o layout atual. Os guias de atualização específicos de plugins ficam junto aos respectivos canais:

- [Migração do Matrix](/pt-BR/channels/matrix-migration): limites de recuperação do estado criptografado, comportamento de snapshots automáticos e comandos de recuperação manual.

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência da CLI para importações entre sistemas.
- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após a migração.
- [Desinstalação](/pt-BR/install/uninstall): remoção completa do OpenClaw.
