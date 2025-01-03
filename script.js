class InsertionSortVisualizer {
    constructor() {
        this.array = [];
        this.currentStep = 0;
        this.steps = [];
        this.arrayContainer = document.getElementById('arrayContainer');
        this.stepText = document.getElementById('stepText');
        
        this.boundInitialize = this.initialize.bind(this);
        this.boundNextStep = this.nextStep.bind(this);
        this.boundReset = this.reset.bind(this);
        this.initializeEventListeners();
        
        // Add menu toggle functionality
        const menuToggle = document.querySelector('.menu-toggle');
        const navButtons = document.querySelector('.nav-buttons');
        
        if (menuToggle && navButtons) {
            menuToggle.addEventListener('click', () => {
                navButtons.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navButtons.contains(e.target)) {
                    navButtons.classList.remove('show');
                }
            });
        }
    }

    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', this.boundInitialize);
        document.getElementById('nextBtn').addEventListener('click', this.boundNextStep);
        document.getElementById('resetBtn').addEventListener('click', this.boundReset);
        document.getElementById('arrayInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.initialize();
        });
    }

    createNumberBox(number, index, className = '') {
        const box = document.createElement('div');
        box.className = `number-box ${className}`;
        box.textContent = number;
        box.id = `box-${index}`;
        return box;
    }

    showComparison(index1, index2) {
        const container = document.getElementById('comparisonContainer');
        const box1 = document.getElementById(`box-${index1}`);
        const box2 = document.getElementById(`box-${index2}`);
        
        if (!box1 || !box2) return;
        
        const box1Rect = box1.getBoundingClientRect();
        const box2Rect = box2.getBoundingClientRect();
        const containerRect = this.arrayContainer.getBoundingClientRect();
        
        // Calculate positions with precise centering
        const leftPos = Math.round(box1Rect.left - containerRect.left + (box1Rect.width / 2));
        const rightPos = Math.round(box2Rect.left - containerRect.left + (box2Rect.width / 2));
        
        // Position vertical lines with adjustment for line width
        const leftLine = container.querySelector('.comparison-vertical.left');
        const rightLine = container.querySelector('.comparison-vertical.right');
        
        leftLine.style.left = `${leftPos - 1.5}px`;  // Adjust by half of line width (3px/2)
        rightLine.style.left = `${rightPos - 1.5}px`; // Adjust by half of line width (3px/2)
        
        // Position and size the horizontal line
        const line = container.querySelector('.comparison-line');
        line.style.left = `${leftPos}px`;
        line.style.width = `${rightPos - leftPos}px`;
        
        // Make sure it's visible
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.classList.remove('hidden');
    }

    hideComparison() {
        const container = document.getElementById('comparisonContainer');
        if (container) {
            container.classList.add('hidden');
            container.style.display = 'none';
            container.style.visibility = 'hidden';
        }
        
        // Remove any ongoing animations
        document.querySelectorAll('.number-box').forEach(box => {
            box.classList.remove('swapping-left', 'swapping-right');
            box.style.removeProperty('--swap-distance');
        });
    }

    displayArray(comparingIndices = [], sortedUpTo = -1) {
        this.arrayContainer.innerHTML = '';
        this.array.forEach((num, i) => {
            let className = '';
            if (comparingIndices.includes(i)) {
                className = 'comparing';
            } else if (i <= sortedUpTo) {
                className = 'sorted';
            }
            this.arrayContainer.appendChild(this.createNumberBox(num, i, className));
        });
    }

    initialize() {
        const input = document.getElementById('arrayInput').value;
        if (!input.trim()) {
            this.stepText.textContent = "Please enter some numbers!";
            return;
        }
        this.array = input.split(',')
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num));
        
        if (this.array.length < 2) {
            this.stepText.textContent = "Please enter at least 2 valid numbers!";
            return;
        }
        if (this.array.length > 10) {
            this.stepText.textContent = "Please enter no more than 10 numbers!";
            return;
        }

        this.currentStep = 0;
        this.generateSteps();
        this.displayArray();
        document.getElementById('nextBtn').disabled = false;
        document.getElementById('startBtn').disabled = true;
        this.stepText.textContent = "Click 'Next Step' to begin sorting!";
    }

    generateSteps() {
        this.steps = [];
        const arr = [...this.array];
        let stepCount = 0;
        
        for (let i = 1; i < arr.length; i++) {
            let j = i - 1;
            let currentElement = arr[i];
            let hasSwapped = false;
            
            while (j >= 0 && arr[j] > currentElement) {
                // Compare step
                this.steps.push({
                    type: 'compare',
                    indices: [j, j + 1],
                    sortedUpTo: i,
                    message: `Comparing <span class="highlight-compare">${arr[j]}</span> with <span class="highlight-compare">${arr[j + 1]}</span>: ${arr[j]} > ${arr[j + 1]}, need to swap`
                });
                stepCount++;

                // Swap step
                arr[j + 1] = arr[j];
                arr[j] = currentElement;
                this.steps.push({
                    type: 'swap',
                    indices: [j, j + 1],
                    sortedUpTo: i,
                    message: `<span class="highlight-swap">Swapping ${arr[j]} and ${arr[j + 1]}</span>`
                });
                stepCount++;
                
                hasSwapped = true;
                j--;
            }
            
            // Add comparison step for the final comparison that doesn't result in a swap
            if (j >= 0 || !hasSwapped) {
                this.steps.push({
                    type: 'compare',
                    indices: [Math.max(0, j), j + 1],
                    sortedUpTo: i,
                    message: `Comparing <span class="highlight-compare">${arr[Math.max(0, j)]}</span> with <span class="highlight-compare">${arr[j + 1]}</span>: ${arr[Math.max(0, j)]} ≤ ${arr[j + 1]}, no swap needed`
                });
                stepCount++;
            }
        }

        // Add the completion step
        this.steps.push({
            type: 'complete',
            sortedUpTo: arr.length - 1,
            message: '<span class="highlight-swap">Sorting complete!</span>'
        });
        stepCount++;

        // Update step counter
        document.getElementById('stepNumber').textContent = `Step: 0/${stepCount}`;
    }

    async nextStep() {
        if (this.currentStep >= this.steps.length) return;

        const step = this.steps[this.currentStep];
        this.hideComparison();

        switch (step.type) {
            case 'compare':
                this.displayArray(step.indices, step.sortedUpTo);
                this.showComparison(step.indices[0], step.indices[1]);
                break;
            case 'swap':
                const [i, j] = step.indices;
                await this.animateSwap(i, j);
                [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
                this.displayArray(step.indices, step.sortedUpTo);
                break;
            case 'complete':
                this.displayArray([], step.sortedUpTo);
                document.getElementById('nextBtn').disabled = true;
                break;
        }

        this.stepText.innerHTML = step.message;
        document.getElementById('stepNumber').textContent = 
            `Step: ${this.currentStep + 1}/${this.steps.length}`;
        this.currentStep++;
    }

    async animateSwap(index1, index2) {
        try {
            const box1 = document.getElementById(`box-${index1}`);
            const box2 = document.getElementById(`box-${index2}`);
            
            if (!box1 || !box2) return;
            
            const box1Rect = box1.getBoundingClientRect();
            const box2Rect = box2.getBoundingClientRect();
            
            const distance = box2Rect.left - box1Rect.left;
            
            box1.style.setProperty('--swap-distance', `${distance}px`);
            box2.style.setProperty('--swap-distance', `${-distance}px`);
            
            box1.classList.add('swapping-right');
            box2.classList.add('swapping-left');
            
            await new Promise(resolve => setTimeout(resolve, 600));
            
            box1.classList.remove('swapping-right');
            box2.classList.remove('swapping-left');
        } catch (error) {
            console.error('Animation error:', error);
            // Cleanup in case of error
            document.querySelectorAll('.number-box').forEach(box => {
                box.classList.remove('swapping-left', 'swapping-right');
                box.style.removeProperty('--swap-distance');
            });
        }
    }

    reset() {
        this.array = [];
        this.currentStep = 0;
        this.steps = [];
        this.arrayContainer.innerHTML = '';
        this.hideComparison();
        document.querySelectorAll('.number-box').forEach(box => {
            box.classList.remove('swapping-left', 'swapping-right');
            box.style.removeProperty('--swap-distance');
        });
        document.getElementById('arrayInput').value = '';
        document.getElementById('nextBtn').disabled = true;
        document.getElementById('startBtn').disabled = false;
        this.stepText.textContent = "Enter numbers and click 'Initialize' to begin!";
    }

    cleanup() {
        document.getElementById('startBtn').removeEventListener('click', this.boundInitialize);
        document.getElementById('nextBtn').removeEventListener('click', this.boundNextStep);
        document.getElementById('resetBtn').removeEventListener('click', this.boundReset);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new InsertionSortVisualizer();
});

const codeSnippets = {
    c: `#include <stdio.h>
    
void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

int main() {
    int arr[] = {55, 44, 33, 22, 11};
    int n = sizeof(arr) / sizeof(arr[0]);
    insertionSort(arr, n);
    printf("Sorted array: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key

arr = [55, 44, 33, 22, 11]
insertion_sort(arr)
print("Sorted array:", arr)`,
    java: `public class InsertionSort {
    public static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

    public static void main(String[] args) {
        int[] arr = {55, 44, 33, 22, 11};
        insertionSort(arr);
        System.out.print("Sorted array: ");
        for (int num : arr) {
            System.out.print(num + " ");
        }
        System.out.println();
    }
}`,
    javascript: `function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

let arr = [55, 44, 33, 22, 11];
insertionSort(arr);
console.log("Sorted array:", arr);`,
    ruby: `def insertion_sort(arr)
    for i in 1...arr.length
        key = arr[i]
        j = i - 1
        while j >= 0 && arr[j] > key
            arr[j + 1] = arr[j]
            j -= 1
        end
        arr[j + 1] = key
    end
end

arr = [55, 44, 33, 22, 11]
insertion_sort(arr)
puts "Sorted array: #{arr}"`,
    go: `package main

import "fmt"

func insertionSort(arr []int) {
    for i := 1; i < len(arr); i++ {
        key := arr[i]
        j := i - 1
        for j >= 0 && arr[j] > key {
            arr[j+1] = arr[j]
            j--
        }
        arr[j+1] = key
    }
}

func main() {
    arr := []int{55, 44, 33, 22, 11}
    insertionSort(arr)
    fmt.Print("Sorted array: ")
    for _, num := range arr {
        fmt.Print(num, " ")
    }
    fmt.Println()
}`
};

document.querySelectorAll('.lang-btn').forEach(button => {
    button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        document.getElementById('codeSnippet').textContent = codeSnippets[lang];
    });
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const code = document.getElementById('codeSnippet').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const message = document.getElementById('copyMessage');
        message.style.display = 'block'; // Show the message
        message.style.opacity = '1'; // Make it visible
        setTimeout(() => {
            message.style.opacity = '0'; // Fade out
            setTimeout(() => {
                message.style.display = 'none'; // Hide after fade
            }, 500); // Match the duration of the fade
        }, 1500); // Show for 1.5 seconds
    });
});

document.getElementById('goToCodeBtn').addEventListener('click', () => {
    const codeSection = document.querySelector('.code-section');
    codeSection.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to the code section
}); 