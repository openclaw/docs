---
read_when:
    - Entendendo os resultados de verificação e moderação do ClawHub
    - Relatar uma Skill ou um pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, varredura, denúncias e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub é aberto a publicações, mas as listagens públicas ainda passam por controles de confiança,
varredura, denúncia e moderação. O objetivo é prático: ajudar os usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou plugin, verifique a listagem dela no ClawHub para:

- atribuição de proprietário e origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões necessárias
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e em que confia.

## Estados de varredura

ClawHub pode mostrar resultados de varredura ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não terminaram.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente
  disponível nas superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma
versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva
o problema ou a moderação a restaure.

## Skills

As varreduras de Skills analisam o pacote de skill publicado, os metadados, os requisitos
declarados e instruções suspeitas.

ClawHub presta atenção especial a incompatibilidades entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes da
instalação.

As descobertas da varredura são baseadas em artefatos. Comportamentos esperados do provedor, como
credenciais de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo,
codificação Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor declarado,
são tratados de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos
privados, destinos de rede não relacionados ou abuso furtivo do navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

As versões de plugins incluem metadados do pacote, atribuição de origem, campos de compatibilidade
e informações de integridade do artefato.

OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de
pacote também podem expor metadados de resumo para que OpenClaw possa verificar artefatos
baixados. ClawScan inclui metadados declarados de env/config `openclaw.environment` do pacote ao
revisar versões de plugins, para que os requisitos declarados de runtime sejam comparados com o
comportamento observado.

## Denúncias

Usuários conectados podem denunciar Skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso de denúncias também pode levar a
ações contra a conta.

Exemplos de denúncias:

- metadados enganosos
- requisitos de credencial ou permissão não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola o [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Notas do ClawScan para publicadores

Publicadores podem fornecer uma nota opcional do ClawScan ao publicar uma skill ou
plugin. Essa nota dá ao ClawScan contexto sobre comportamentos que poderiam parecer
incomuns, como acesso à rede, acesso a host nativo ou credenciais específicas de
provedor.

## Retenções de moderação

Quando o scanner estático marca uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob uma retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as skills do publicador, faz publicações futuras
começarem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Descobertas estáticas suspeitas são mantidas como evidência de arquivo/linha para moderadores,
mas não ocultam conteúdo nem decidem sozinhas o veredito público da varredura.
Novos envios permanecem em estado de revisão/pendente até que a revisão do LLM seja concluída. A
varredura estática só bloqueia imediatamente assinaturas maliciosas. Detecções de mecanismos do
VirusTotal permanecem visíveis como evidência de segurança, mas vereditos do VirusTotal Code
Insight/Palm são consultivos e não ocultam skills por si só. Revisões do LLM do ClawScan
mantêm notas alinhadas ao propósito como orientação. Descobertas de revisão média permanecem
visíveis no artefato, enquanto o filtro suspeito fica reservado para preocupações de alto impacto
do LLM, descobertas maliciosas ou detecções corroboradas por mecanismos AV.

Admins podem remover uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
skills ocultas pela retenção em nível de usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria varredura estática
permanece maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens da API do ClawHub. Se a autenticação
da CLI começar a falhar após uma ação na conta, entre na interface web para revisar o
estado da conta. Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para uma revisão de recuperação.

## Orientações para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- adicione uma nota do ClawScan do publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- vincule à origem quando possível
- use execuções simuladas antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
