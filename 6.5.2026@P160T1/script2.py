import tkinter as tk
from tkinter import *

# Δημιουργία κύριου παραθύρου
root = tk.Tk()
root.title("Σελίδα Διεπαφής Εταιρίας")
root.geometry("500x300")

# 1. Όνομα εταιρείας με κεφαλαίους ελληνικούς χαρακτήρες
company_label = tk.Label(root, text="Εταιρία ΑΒ", font=("Arial", 18, "bold"), fg="blue")
company_label.pack(pady=20)

# 2. Φόρμα εισαγωγής επαγγέλματος χρήστη
profession_label = tk.Label(root, text="Εισάγετε το επάγκελμά σας:", font=("Arial", 12))
profession_label.pack(pady=10)
profession_entry = tk.Entry(root, font=("Arial", 12), width=30)
profession_entry.pack(pady=5)


# Κουμπί υποβολής
def submit():
    profession = profession_entry.get()


# result_label.config(text=f "Το επάγγελμά σας είναι: {profession}")
submit_button = tk.Button(
    root, text="Αποστολή", command=submit, font=("Arial", 12), bg="lightgray"
)
submit_button.pack(pady=15)
# Ετικέτα εμφάνισης αποτελέσματος

result_label = tk.Label(root, text="", font=("Arial", 12), fg="green")
result_label.pack(pady=10)

# Εκκίνηση παραθύρου
root.mainloop()
