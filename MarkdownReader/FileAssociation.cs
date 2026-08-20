using Microsoft.Win32;

namespace MarkdownReader;

/// <summary>
/// Registers / unregisters the .md file association so double-clicking
/// a .md file in Windows Explorer opens this application.
///
/// Call FileAssociation.Register() once (e.g. on first launch or from an installer).
/// </summary>
public static class FileAssociation
{
    private const string ProgId     = "MarkdownReader.md";
    private const string Extension  = ".md";
    private const string FriendlyName = "Markdown File";

    public static void Register()
    {
        try
        {
            var exePath = Environment.ProcessPath ?? Environment.GetCommandLineArgs()[0];

            // 1. Create ProgID key
            using var progKey = Registry.CurrentUser.CreateSubKey(
                $@"SOFTWARE\Classes\{ProgId}");
            progKey.SetValue("", FriendlyName);

            using var iconKey = progKey.CreateSubKey("DefaultIcon");
            iconKey.SetValue("", $"\"{exePath}\",0");

            using var openKey = progKey.CreateSubKey(@"shell\open\command");
            openKey.SetValue("", $"\"{exePath}\" \"%1\"");

            // 2. Map extension to ProgID
            using var extKey = Registry.CurrentUser.CreateSubKey(
                $@"SOFTWARE\Classes\{Extension}");
            extKey.SetValue("", ProgId);

            // 3. Notify Windows shell about the change
            SHChangeNotify(0x08000000, 0x0000, IntPtr.Zero, IntPtr.Zero);
        }
        catch
        {
            // Non-fatal: association is a convenience, not a requirement
        }
    }

    public static void Unregister()
    {
        try
        {
            Registry.CurrentUser.DeleteSubKeyTree(
                $@"SOFTWARE\Classes\{ProgId}", throwOnMissingSubKey: false);
        }
        catch { }
    }

    [System.Runtime.InteropServices.DllImport("shell32.dll")]
    private static extern void SHChangeNotify(
        uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
