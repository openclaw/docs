---
read_when:
    - Entendendo os resultados de varredura e moderação do ClawHub
    - Relatar uma skill ou um pacote
    - Recuperando uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, varredura, relatórios e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-11T22:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub é aberto para publicação, mas listagens públicas ainda passam por controles de confiança,
verificação, denúncias e moderação. O objetivo é prático: ajudar usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou Plugin, verifique a listagem dela no ClawHub para:

- proprietário e atribuição de origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões necessárias
- metadados de compatibilidade para Plugins
- status de verificação ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e em que confia.

## Estados de verificação

O ClawHub pode mostrar resultados de verificação ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueador foi encontrado.
- `suspicious`: o lançamento exige cautela ou revisão.
- `malicious`: o lançamento é considerado inseguro.
- `pending`: as verificações ainda não terminaram.
- `held`, `quarantined`, `revoked` ou `hidden`: o lançamento não está totalmente
  disponível nas superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se um
lançamento estiver retido ou bloqueado, os usuários não devem instalá-lo até que o proprietário resolva
o problema ou a moderação o restaure.

## Skills

As verificações de Skills analisam o pacote de skill publicado, metadados, requisitos
declarados e instruções suspeitas.

O ClawHub presta atenção especial a incompatibilidades entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes
de instalar.

As descobertas de verificação são baseadas em artefatos. Comportamento esperado do provedor, como
credenciais de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo,
codificação de Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor declarado, é tratado
de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados,
destinos de rede não relacionados ou abuso furtivo do navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Os lançamentos de Plugins incluem metadados de pacote, atribuição de origem, campos
de compatibilidade e informações de integridade do artefato.

O OpenClaw verifica a compatibilidade antes de instalar Plugins hospedados no ClawHub. Registros de pacote
também podem expor metadados de digest para que o OpenClaw possa verificar artefatos
baixados. O ClawScan inclui metadados de env/config declarados em `openclaw.environment` do pacote
ao revisar lançamentos de Plugins, para que os requisitos de runtime declarados sejam
comparados ao comportamento observado.

## Denúncias

Usuários autenticados podem denunciar Skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso de denúncias pode, por si só, levar a
ações contra a conta.

Exemplos de denúncias:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola o [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Observações do ClawScan para publicadores

Publicadores podem fornecer uma observação opcional do ClawScan ao publicar uma skill ou
Plugin. Essa observação dá contexto ao ClawScan para comportamentos que poderiam parecer
incomuns, como acesso à rede, acesso a host nativo ou credenciais específicas
de provedor.

## Retenções de moderação

Quando o scanner estático sinaliza uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob uma retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as Skills do publicador, faz com que publicações futuras
comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Descobertas estáticas suspeitas são retidas como evidência de arquivo/linha para moderadores,
mas elas não ocultam conteúdo nem decidem o veredito público de verificação por conta própria.
Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A verificação
estática só bloqueia imediatamente assinaturas maliciosas. Ocorrências de mecanismos do VirusTotal
permanecem evidências de segurança visíveis, mas os vereditos do VirusTotal Code Insight/Palm
são consultivos e não ocultam Skills por conta própria. Revisões LLM do ClawScan
mantêm observações alinhadas ao propósito como orientação. Descobertas médias de revisão permanecem visíveis no
artefato, enquanto o filtro suspeito é reservado para preocupações LLM de alto impacto,
descobertas maliciosas ou detecções corroboradas por mecanismos AV.

Admins podem remover uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
Skills ocultas pela retenção em nível de usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria verificação estática permanece
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação pela CLI
começar a falhar após uma ação contra a conta, entre na interface Web para revisar o estado da conta. Se o login
ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para uma análise de recuperação.

## Orientações para publicadores

Para reduzir falsos positivos e aumentar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- adicione uma observação do ClawScan para o publicador quando um lançamento tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- crie links para a origem quando possível
- use dry runs antes de publicar Plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
