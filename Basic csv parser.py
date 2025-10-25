#Basic csv parser
import csv

with open('games.csv', mode='r') as file:
    csv_reader = csv.reader(file)
    for row in csv_reader:
        
