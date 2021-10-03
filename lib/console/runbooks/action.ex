defprotocol Console.Runbooks.Action do
  @spec enact(struct, Console.Runbooks.Actor.t) :: {:ok | :error, any}
  def enact(action, struct)
end

defmodule Console.Runbooks.Actor do
  alias Console.Runbooks.Action, as: ActionImpl
  alias Kube.Runbook.{Action, ConfigurationAction}

  defstruct [:ctx, :repo, :actor]

  @type t :: %__MODULE__{}

  def build(repo, ctx, actor), do: %__MODULE__{ctx: ctx, repo: repo, actor: actor}

  def enact(%Action{configuration: %ConfigurationAction{} = act}, actor) do
    ActionImpl.enact(act, actor)
  end
end


defimpl Console.Runbooks.Action, for: Kube.Runbook.ConfigurationAction do
  alias Console.Services.Plural
  alias Console.Runbooks.Actor
  alias Console.Services.Builds
  alias Kube.Runbook

  def enact(%{updates: updates}, %Actor{ctx: ctx, repo: repo, actor: actor}) do
    with {:ok, vals} <- Plural.values_file(repo),
         {:ok, map} <- YamlElixir.read_from_string(vals),
         map <- make_updates(updates, map, ctx),
         {:ok, doc} <- Ymlr.document(map),
         _ <- Console.Deployer.update(repo, String.trim_leading(doc, "---\n"), :helm) do
      Builds.create(%{
        type: :deploy,
        repository: repo,
        message: "updated configuration"
      }, actor)
    end
  end

  defp make_updates(updates, values, map) do
    Enum.reduce(updates, values, fn %Runbook.PathUpdate{path: path, value_from: from}, acc ->
      Console.put_path(acc, path, map[from])
    end)
  end
end