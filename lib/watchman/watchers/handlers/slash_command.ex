defmodule Watchman.Watchers.Handlers.SlashCommand do
  alias Kube.Client
  alias Kube.SlashCommand
  alias Watchman.Plural.Incidents
  alias Watchman.Services.{Users, Builds}

  def handle(%{"text" => "/" <> command, "incident" => %{"id" => id, "repository" => %{"name" => name}}}) do
    with {:ok, command, args} <- extract_details(command),
         {:ok, slash_command} <- Client.get_slashcommand(name, command) |> IO.inspect(),
         result <- dispatch(slash_command, name),
         {:ok, msg} <- Incidents.create_message(id, "I just executed command #{command} in cluster"),
      do: {:ok, result, msg}
  end
  def handle(_), do: :ok

  defp dispatch(%SlashCommand{spec: %{type: "deploy"}}, name) do
    bot = Users.get_bot!("watchman")
    Builds.create(%{
      type: :deploy,
      repository: name,
      message: "Deployed via slashcommand"
    }, bot)
  end

  defp extract_details(command) do
    String.split(command, " ")
    |> case do
      [command | args] -> {:ok, command, args}
      _ -> :ok
    end
  end
end
