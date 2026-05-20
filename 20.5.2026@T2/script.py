#2.1


class Student: 
    def __init__(self, onoma, hlikia, fylo):
        self.onoma=onoma
        self.hlikia=hlikia
        self.fylo=fylo
    def display(self):
        print("Όνομα: ", self.onoma)
        print("Ηλικία: ",self.hlikia)


#α) __init__

#β) ιδιοότητες: onoma, hlikia, fylo. μέθοδοι: display.

#γ) 

Student1 = Student("Γεωργίου", 17, "κορίτσι")

#δ)

Student.display(Student1)

#2.2

def divisor(N):
    count=0
    for k in range(1, N + 1):
        if(N % k == 0):
            print(k)
            count += 1
    return count

divisor(50)